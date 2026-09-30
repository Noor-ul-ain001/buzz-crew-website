import uuid
from typing import Any


def valid_lead(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "name": "Ayesha Khan",
        "email": "Ayesha@Example.com",
        "phone": "+92 300 1234567",
        "business": "Khan Dental",
        "country": "pakistan",
        "services": ["branding", "digital_marketing"],
        "budget_range": "50k_150k",
        "message": "We need more patients from Google in Karachi.",
        "source_page": "/services/seo",
        "idempotency_key": str(uuid.uuid4()),
    }
    payload.update(overrides)
    return payload
