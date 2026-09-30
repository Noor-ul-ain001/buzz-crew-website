"""The 004 content types: schemas, publish rules and public shapes.

See specs/004-content-publishing/contracts/content.openapi.yaml.
"""

import re
import uuid
from datetime import datetime
from typing import Annotated, Any
from urllib.parse import urlparse

from fastapi import HTTPException, status
from pydantic import BaseModel, Field, StringConstraints, field_validator
from sqlmodel import Session, col, select

from app.models.content import ClientLogo, Faq, Post, TeamMember, Testimonial
from app.models.lead import Country
from app.models.media import Media
from app.models.publishable import PublishStatus
from app.services.media_service import alt_text_problem
from app.services.publishing import ContentType, MediaMap, media_for

Text100 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]
Text300 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=300)]
Text400 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=400)]
Text40 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)]
Text60 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)]
Text120 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)]
Text160 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=160)]
Text200 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=50_000)]


VIDEO_HOSTS = {"youtube.com", "youtu.be", "vimeo.com", "instagram.com"}
VIDEO_HOSTS_MESSAGE = "Accepted links: YouTube, Vimeo, Instagram"


def _host(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    return host.removeprefix("www.").removeprefix("m.")


def clean_video_url(value: str | None) -> str | None:
    value = (value or "").strip()
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or _host(value) not in VIDEO_HOSTS:
        raise ValueError(VIDEO_HOSTS_MESSAGE)
    return value


def clean_web_url(value: str | None) -> str | None:
    value = (value or "").strip()
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or "." not in (parsed.hostname or ""):
        raise ValueError("Enter a full link starting with https://")
    return value


# --- shared shapes ---------------------------------------------------------------------------


class MediaOut(BaseModel):
    id: uuid.UUID
    url: str
    alt_text: str | None
    width: int
    height: int
    warnings: list[str] = []


class PublicImage(BaseModel):
    url: str
    alt: str
    width: int
    height: int


def media_out(media: Media | None) -> MediaOut | None:
    if media is None:
        return None
    return MediaOut(
        id=media.id, url=media.url, alt_text=media.alt_text, width=media.width, height=media.height
    )


def public_image(media: Media | None) -> PublicImage | None:
    if media is None:
        return None
    return PublicImage(
        url=media.url, alt=media.alt_text or "", width=media.width, height=media.height
    )


class AdminMeta(BaseModel):
    id: uuid.UUID
    status: PublishStatus
    sort_order: int
    version: int
    published_at: datetime | None
    last_published_at: datetime | None
    updated_at: datetime
    updated_by_name: str | None
    thumbnail_url: str | None


def required(errors: dict[str, str], field: str, value: object, message: str) -> None:
    if value is None or (isinstance(value, str) and not value.strip()):
        errors[field] = message


def image_rule(errors: dict[str, str], field: str, media: Media | None, *, needed: bool) -> None:
    if media is None:
        if needed:
            errors[field] = "Add an image."
        return
    problem = alt_text_problem(media)
    if problem:
        errors[f"{field}.alt_text"] = problem


# --- testimonials ----------------------------------------------------------------------------


class TestimonialFields(BaseModel):
    name: Text100 = ""
    role: Text100 = ""
    company: Text100 = ""
    country: Country | None = None
    quote: Text400 = ""
    photo_id: uuid.UUID | None = None
    video_url: str | None = None

    _video = field_validator("video_url")(clean_video_url)


class TestimonialUpdate(TestimonialFields):
    version: int


class TestimonialAdmin(AdminMeta):
    name: str
    role: str
    company: str
    country: Country | None
    quote: str
    photo: MediaOut | None
    video_url: str | None


class PublicTestimonial(BaseModel):
    id: uuid.UUID
    name: str
    role: str
    company: str
    country: Country | None
    quote: str
    photo: PublicImage | None
    video_url: str | None


def testimonial_rules(item: Testimonial, media: MediaMap) -> dict[str, str]:
    errors: dict[str, str] = {}
    required(errors, "name", item.name, "Enter the name.")
    required(errors, "role", item.role, "Enter their role.")
    required(errors, "company", item.company, "Enter the company.")
    required(errors, "country", item.country, "Choose a country.")
    if len(item.quote.strip()) < 20:
        errors["quote"] = "Quote must be at least 20 characters."
    image_rule(errors, "photo", media_for(item, "photo_id", media), needed=False)
    if item.video_url:
        try:
            clean_video_url(item.video_url)
        except ValueError as error:
            errors["video_url"] = str(error)
    return errors


def testimonial_public(item: Testimonial, media: MediaMap) -> PublicTestimonial:
    return PublicTestimonial(
        id=item.id,
        name=item.name,
        role=item.role,
        company=item.company,
        country=item.country,
        quote=item.quote,
        photo=public_image(media_for(item, "photo_id", media)),
        video_url=item.video_url,
    )


TESTIMONIALS = ContentType(
    slug="testimonials",
    activity_name="testimonial",
    label="testimonial",
    model=Testimonial,
    create_schema=TestimonialFields,
    update_schema=TestimonialUpdate,
    admin_schema=TestimonialAdmin,
    public_schema=PublicTestimonial,
    media_fields=("photo_id",),
    rules=testimonial_rules,
    to_public=testimonial_public,
    tags=("testimonials",),
)


# --- client logos ----------------------------------------------------------------------------


class ClientLogoFields(BaseModel):
    name: Text100 = ""
    logo_id: uuid.UUID | None = None
    website_url: str | None = None

    _website = field_validator("website_url")(clean_web_url)


class ClientLogoUpdate(ClientLogoFields):
    version: int


class ClientLogoAdmin(AdminMeta):
    name: str
    logo: MediaOut | None
    website_url: str | None


class PublicClientLogo(BaseModel):
    id: uuid.UUID
    name: str
    logo: PublicImage
    website_url: str | None


def client_logo_rules(item: ClientLogo, media: MediaMap) -> dict[str, str]:
    errors: dict[str, str] = {}
    required(errors, "name", item.name, "Enter the client's name.")
    image_rule(errors, "logo", media_for(item, "logo_id", media), needed=True)
    return errors


def client_logo_public(item: ClientLogo, media: MediaMap) -> PublicClientLogo | None:
    logo = public_image(media_for(item, "logo_id", media))
    if logo is None:  # can't happen for items that passed the publish rules
        return None
    return PublicClientLogo(id=item.id, name=item.name, logo=logo, website_url=item.website_url)


CLIENT_LOGOS = ContentType(
    slug="client-logos",
    activity_name="client_logo",
    label="client logo",
    model=ClientLogo,
    create_schema=ClientLogoFields,
    update_schema=ClientLogoUpdate,
    admin_schema=ClientLogoAdmin,
    public_schema=PublicClientLogo,
    media_fields=("logo_id",),
    rules=client_logo_rules,
    to_public=client_logo_public,
    tags=("client-logos",),
)


# --- team members ----------------------------------------------------------------------------


class TeamMemberFields(BaseModel):
    name: Text100 = ""
    role: Text100 = ""
    bio: Text300 = ""
    photo_id: uuid.UUID | None = None


class TeamMemberUpdate(TeamMemberFields):
    version: int


class TeamMemberAdmin(AdminMeta):
    name: str
    role: str
    bio: str
    photo: MediaOut | None


class PublicTeamMember(BaseModel):
    id: uuid.UUID
    name: str
    role: str
    bio: str
    photo: PublicImage


def team_member_rules(item: TeamMember, media: MediaMap) -> dict[str, str]:
    errors: dict[str, str] = {}
    required(errors, "name", item.name, "Enter the name.")
    required(errors, "role", item.role, "Enter their role.")
    required(errors, "bio", item.bio, "Write a short bio.")
    image_rule(errors, "photo", media_for(item, "photo_id", media), needed=True)
    return errors


def team_member_public(item: TeamMember, media: MediaMap) -> PublicTeamMember | None:
    photo = public_image(media_for(item, "photo_id", media))
    if photo is None:  # required to publish
        return None
    return PublicTeamMember(id=item.id, name=item.name, role=item.role, bio=item.bio, photo=photo)


TEAM_MEMBERS = ContentType(
    slug="team-members",
    activity_name="team_member",
    label="team member",
    model=TeamMember,
    create_schema=TeamMemberFields,
    update_schema=TeamMemberUpdate,
    admin_schema=TeamMemberAdmin,
    public_schema=PublicTeamMember,
    media_fields=("photo_id",),
    rules=team_member_rules,
    to_public=team_member_public,
    tags=("team-members",),
)

# --- FAQs ------------------------------------------------------------------------------------


class FaqFields(BaseModel):
    group: Text60 = ""
    question: Text200 = ""
    answer: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)] = ""


class FaqUpdate(FaqFields):
    version: int


class FaqAdmin(AdminMeta):
    group: str
    question: str
    answer: str


class PublicFaq(BaseModel):
    id: uuid.UUID
    group: str
    question: str
    answer: str


def faq_rules(item: Faq, media: MediaMap) -> dict[str, str]:
    errors: dict[str, str] = {}
    required(errors, "group", item.group, "Choose a group.")
    required(errors, "question", item.question, "Write the question.")
    if len(item.answer.strip()) < 10:
        errors["answer"] = "Answer must be at least 10 characters."
    return errors


def faq_public(item: Faq, media: MediaMap) -> PublicFaq:
    return PublicFaq(id=item.id, group=item.group, question=item.question, answer=item.answer)


FAQS = ContentType(
    slug="faqs",
    activity_name="faq",
    label="FAQ",
    model=Faq,
    create_schema=FaqFields,
    update_schema=FaqUpdate,
    admin_schema=FaqAdmin,
    public_schema=PublicFaq,
    media_fields=(),
    rules=faq_rules,
    to_public=faq_public,
    tags=("faqs",),
)


# --- blog posts ------------------------------------------------------------------------------

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class PostFields(BaseModel):
    slug: Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)] | None = None
    title: Text120 = ""
    excerpt: Text300 = ""
    body_md: LongText = ""
    cover_id: uuid.UUID | None = None
    author_name: Text100 = ""
    author_role: Text100 = ""
    category: Text40 = ""
    tags: list[Text40] = Field(default_factory=lambda: list[str](), max_length=12)
    reading_minutes: int = Field(default=1, ge=1, le=120)
    seo_title: Text60 = ""
    seo_description: Text160 = ""

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, value: str | None) -> str | None:
        if not value:
            return None
        if not SLUG_PATTERN.match(value):
            raise ValueError("Use lowercase letters, numbers and hyphens only.")
        return value


class PostUpdate(PostFields):
    version: int


class PostAdmin(AdminMeta):
    slug: str | None
    title: str
    excerpt: str
    body_md: str
    cover: MediaOut | None
    author_name: str
    author_role: str
    category: str
    tags: list[str]
    reading_minutes: int
    seo_title: str
    seo_description: str


class PublicPost(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    excerpt: str
    body_md: str
    cover: PublicImage | None
    author_name: str
    author_role: str
    category: str
    tags: list[str]
    reading_minutes: int
    seo_title: str
    seo_description: str
    published_at: datetime | None
    updated_at: datetime


def post_rules(item: Post, media: MediaMap) -> dict[str, str]:
    errors: dict[str, str] = {}
    required(errors, "slug", item.slug, "Give the post an address.")
    required(errors, "title", item.title, "Write a title.")
    required(errors, "excerpt", item.excerpt, "Write a short excerpt.")
    required(errors, "category", item.category, "Choose a category.")
    required(errors, "author_name", item.author_name, "Add the author's name.")
    if len(item.body_md.strip()) < 50:
        errors["body_md"] = "The post needs at least 50 characters of body text."
    image_rule(errors, "cover", media_for(item, "cover_id", media), needed=False)
    return errors


def post_public(item: Post, media: MediaMap) -> PublicPost | None:
    if not item.slug:  # required to publish
        return None
    return PublicPost(
        id=item.id,
        slug=item.slug,
        title=item.title,
        excerpt=item.excerpt,
        body_md=item.body_md,
        cover=public_image(media_for(item, "cover_id", media)),
        author_name=item.author_name,
        author_role=item.author_role,
        category=item.category,
        tags=list(item.tags),
        reading_minutes=item.reading_minutes,
        seo_title=item.seo_title,
        seo_description=item.seo_description,
        published_at=item.published_at,
        updated_at=item.updated_at,
    )


def post_before_save(session: Session, item: Post | None, values: dict[str, Any]) -> list[str]:
    """Two posts can't share an address."""
    slug = values.get("slug")
    if not slug or (item is not None and slug == item.slug):
        return []
    taken = session.exec(
        select(Post.id).where(Post.slug == slug, col(Post.deleted_at).is_(None))
    ).first()
    if taken is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "slug_taken",
                "message": "Another post already uses this address. Choose a different one.",
                "fields": {"slug": "This address is already in use."},
            },
        )
    return [f"post:{item.slug}"] if item is not None and item.slug else []


POSTS = ContentType(
    slug="posts",
    activity_name="post",
    label="post",
    model=Post,
    create_schema=PostFields,
    update_schema=PostUpdate,
    admin_schema=PostAdmin,
    public_schema=PublicPost,
    media_fields=("cover_id",),
    rules=post_rules,
    to_public=post_public,
    tags=("posts",),
    before_save=post_before_save,
    item_tags=lambda item: [f"post:{item.slug}"] if item.slug else [],
)

CONTENT_TYPES = (TESTIMONIALS, CLIENT_LOGOS, TEAM_MEMBERS, FAQS, POSTS)
