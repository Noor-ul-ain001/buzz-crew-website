"""Contract checks for POST /api/v1/leads against specs/001-project-inquiry-flow/contracts."""

from pathlib import Path
from typing import Any

import yaml  # pyright: ignore[reportMissingModuleSource]

from tests.helpers import valid_lead

CONTRACT = (
    Path(__file__).resolve().parents[2]
    / "specs"
    / "001-project-inquiry-flow"
    / "contracts"
    / "leads.openapi.yaml"
)


def contract() -> dict[str, Any]:
    return yaml.safe_load(CONTRACT.read_text(encoding="utf-8"))


def test_created_response_matches_contract(client: Any) -> None:
    response = client.post("/api/v1/leads", json=valid_lead())
    assert response.status_code == 201
    body = response.json()
    required = contract()["components"]["schemas"]["LeadCreated"]["required"]
    assert set(required) <= set(body)
    assert body["status"] == "new"
    assert isinstance(body["post_process_token"], str) and len(body["post_process_token"]) >= 32


def test_validation_error_uses_fastapi_shape(client: Any) -> None:
    response = client.post("/api/v1/leads", json=valid_lead(name=""))
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list)
    assert {"loc", "msg", "type"} <= set(detail[0])


def test_enums_match_contract(client: Any) -> None:
    schemas = contract()["components"]["schemas"]
    api = client.get("/openapi.json").json()["components"]["schemas"]
    for name in ("Country", "Service", "BudgetRange"):
        assert sorted(api[name]["enum"]) == sorted(schemas[name]["enum"]), name


def test_create_lead_request_fields_match_contract(client: Any) -> None:
    expected = set(contract()["components"]["schemas"]["LeadCreate"]["properties"])
    api = client.get("/openapi.json").json()["components"]["schemas"]["LeadCreate"]
    assert set(api["properties"]) == expected
