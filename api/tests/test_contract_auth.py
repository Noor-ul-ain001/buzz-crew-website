"""Contract checks for auth and users against specs/003-admin-auth-roles/contracts."""

from pathlib import Path
from typing import Any

import yaml  # pyright: ignore[reportMissingModuleSource]

CONTRACT = (
    Path(__file__).resolve().parents[2]
    / "specs"
    / "003-admin-auth-roles"
    / "contracts"
    / "auth.openapi.yaml"
)


def contract() -> dict[str, Any]:
    return yaml.safe_load(CONTRACT.read_text(encoding="utf-8"))


def schema(name: str) -> dict[str, Any]:
    return contract()["components"]["schemas"][name]


def test_every_contract_operation_exists(client: Any) -> None:
    api_paths = client.get("/openapi.json").json()["paths"]
    for path, operations in contract()["paths"].items():
        assert path in api_paths, path
        for method, operation in operations.items():
            assert method in api_paths[path], (method, path)
            assert api_paths[path][method]["operationId"] == operation["operationId"]


def test_me_matches_contract(admin_client: Any) -> None:
    body = admin_client.get("/api/v1/auth/me").json()
    assert set(schema("Me")["required"]) <= set(body)
    assert body["role"] in schema("Role")["enum"]


def test_user_list_matches_contract(admin_client: Any) -> None:
    users = admin_client.get("/api/v1/users").json()
    assert set(schema("User")["required"]) <= set(users[0])
    assert set(users[0]) <= set(schema("User")["properties"])
    assert users[0]["status"] in schema("UserStatus")["enum"]


def test_error_codes_are_in_contract(client: Any) -> None:
    codes = schema("ErrorDetail")["properties"]["detail"]["properties"]["code"]["enum"]
    response = client.post(
        "/api/v1/auth/login", json={"email": "nobody@example.com", "password": "x"}
    )
    assert response.json()["detail"]["code"] in codes
    assert client.get("/api/v1/auth/me").json()["detail"]["code"] in codes
