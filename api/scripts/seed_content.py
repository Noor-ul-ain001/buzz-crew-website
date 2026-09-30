"""Load the agency's real testimonials and client logos (from ABOUT BUZZ CREW.pdf) into the
database, so the home page shows them once it reads from the API. Safe to run twice: it
does nothing when testimonials or logos already exist.

Images stay in web/public/clients and are recorded as `static:` media (never sent to
Cloudinary). Usage: DATABASE_URL=... uv run python scripts/seed_content.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image  # noqa: E402
from sqlmodel import Session, select  # noqa: E402

from app.core import clock  # noqa: E402
from app.core.database import get_engine  # noqa: E402
from app.models.content import ClientLogo, Testimonial  # noqa: E402
from app.models.lead import Country  # noqa: E402
from app.models.media import Media, MediaMime  # noqa: E402
from app.models.publishable import PublishStatus  # noqa: E402
from app.services.media_store import STATIC_PREFIX  # noqa: E402

PUBLIC = Path(__file__).resolve().parents[2] / "web" / "public"

TESTIMONIALS = [
    (
        "IG Civil Contractor",
        "",
        "Civil contractor, Australia",
        Country.OTHER,
        "Buzz Crew captured our sites beautifully. Every reel felt emotional and cinematic.",
        "ig-civil-contractor",
    ),
    (
        "Ayesha",
        "Founder",
        "Halki Aanch by Ayesha",
        Country.PAKISTAN,
        "The content they made elevated my food campaign beyond expectations.",
        "halki-aanch",
    ),
    (
        "Discovery Homes",
        "",
        "Real estate, Dubai",
        Country.UAE,
        "Buzz Crew made us a customised and tailored CRM system for our client and lead flow. "
        "They were extremely professional throughout.",
        "discovery-homes",
    ),
]

LOGOS = [
    ("farzanas-kitchen", "Farzana's Kitchen"),
    ("dua-greens", "Dua Greens Builders & Developers"),
    ("ibad-traders", "Ibad Traders"),
    ("decor-art", "Decor Art"),
    ("mercantile", "Mercantile"),
    ("pak-tape-industries", "Pak Tape Industries"),
    ("kamil-atelier", "Kamil Atelier"),
    ("ig-civil-contractor", "IG Civil Contractor"),
    ("azee-trading", "AZee Trading Company"),
    ("nawabs-dynasty", "Nawab's Dynasty"),
    ("discovery-homes", "Discovery Homes"),
    ("mr-bawarchi", "Mr. Bawarchi"),
    ("black-gold-farm", "Black Gold Farm"),
    ("ak-travels", "AK Travels & Visa Consultant"),
    ("teh-group", "TEH Group"),
    ("milton-group", "Milton Group"),
    ("halki-aanch", "Halki Aanch by Ayesha"),
    ("islamabad-now", "Islamabad Now"),
    ("awami-web", "Awami Web"),
    ("the-farm-villa", "The Farm Villa"),
    ("frontline-pakistan", "Frontline Pakistan"),
    ("malay-wheels", "Malay Wheels"),
    ("meena-bazar", "Meena Bazar"),
]


def static_media(session: Session, slug: str, alt: str) -> Media:
    path = PUBLIC / "clients" / f"{slug}.webp"
    with Image.open(path) as image:
        width, height = image.size
    media = Media(
        provider_public_id=f"{STATIC_PREFIX}/clients/{slug}.webp",
        url=f"/clients/{slug}.webp",
        alt_text=alt,
        original_filename=path.name,
        mime_type=MediaMime.WEBP,
        width=width,
        height=height,
        size_bytes=path.stat().st_size,
    )
    session.add(media)
    session.flush()
    return media


def main() -> None:
    now = clock.now()
    published = {
        "status": PublishStatus.PUBLISHED,
        "published_at": now,
        "last_published_at": now,
    }
    with Session(get_engine()) as session:
        if session.exec(select(Testimonial)).first() or session.exec(select(ClientLogo)).first():
            print("Content already exists; nothing seeded.")
            return
        for order, (name, role, company, country, quote, slug) in enumerate(TESTIMONIALS):
            photo = static_media(session, slug, f"{company.split(',')[0]} logo")
            session.add(
                Testimonial(
                    name=name,
                    role=role,
                    company=company,
                    country=country,
                    quote=quote,
                    photo_id=photo.id,
                    sort_order=order,
                    **published,
                )
            )
        for order, (slug, name) in enumerate(LOGOS):
            logo = static_media(session, slug, f"{name} logo")
            session.add(ClientLogo(name=name, logo_id=logo.id, sort_order=order, **published))
        session.commit()
    print(f"Seeded {len(TESTIMONIALS)} testimonials and {len(LOGOS)} client logos.")


if __name__ == "__main__":
    main()
