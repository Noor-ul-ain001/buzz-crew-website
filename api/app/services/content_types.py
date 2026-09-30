"""The 004 content types: schemas, publish rules and public shapes.

See specs/004-content-publishing/contracts/content.openapi.yaml.
"""

import uuid
from datetime import datetime
from typing import Annotated
from urllib.parse import urlparse

from pydantic import BaseModel, StringConstraints, field_validator

from app.models.content import ClientLogo, TeamMember, Testimonial
from app.models.lead import Country
from app.models.media import Media
from app.models.publishable import PublishStatus
from app.services.media_service import alt_text_problem
from app.services.publishing import ContentType, MediaMap, media_for

Text100 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]
Text300 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=300)]
Text400 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=400)]


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

CONTENT_TYPES = (TESTIMONIALS, CLIENT_LOGOS, TEAM_MEMBERS)
