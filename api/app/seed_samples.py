"""The website's earlier sample FAQs and blog posts, loaded as drafts to edit or delete.

They come from app/data/sample_content.json and are never published automatically, so
nothing unreviewed reaches the public site. Running it again adds nothing.
"""

import json
from pathlib import Path

from sqlmodel import Session, select

from app.core.database import get_engine
from app.models.content import Faq, Post

SAMPLES = Path(__file__).resolve().parent / "data" / "sample_content.json"


def seed() -> str:
    data = json.loads(SAMPLES.read_text(encoding="utf-8"))
    with Session(get_engine()) as session:
        faqs = posts = 0
        if session.exec(select(Faq)).first() is None:
            for order, item in enumerate(data["faqs"]):
                session.add(Faq(sort_order=order, **item))
                faqs += 1
        if session.exec(select(Post)).first() is None:
            for order, item in enumerate(data["posts"]):
                session.add(
                    Post(
                        sort_order=order,
                        **{
                            **item,
                            "seo_title": item["seo_title"][:60],
                            "seo_description": item["seo_description"][:160],
                        },
                    )
                )
                posts += 1
        session.commit()
    return f"Added {faqs} draft FAQs and {posts} draft posts."
