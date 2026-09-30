"""Every route guarded by require_role(): anonymous → 401, wrong role → 403, right role passes.

New protected routes are covered automatically (quickstart note).
"""

import re
from typing import Any

import pytest
from fastapi.routing import APIRoute, iter_route_contexts

from app.main import app


def _required_roles(route: APIRoute) -> tuple[str, ...] | None:
    stack = list(route.dependant.dependencies)
    while stack:
        dep = stack.pop()
        roles = getattr(dep.call, "required_roles", None)
        if roles is not None:
            return tuple(str(r) for r in roles)
        stack.extend(dep.dependencies)
    return None


PROTECTED = [
    (route, method, roles)
    # This FastAPI keeps included routers lazy; iter_route_contexts flattens them.
    for route in (ctx.original_route for ctx in iter_route_contexts(app.routes))
    if isinstance(route, APIRoute)
    for method in sorted(route.methods)
    if (roles := _required_roles(route)) is not None
]


def _url(route: APIRoute) -> str:
    return re.sub(r"\{[^}]+\}", "00000000-0000-0000-0000-000000000000", route.path)


def test_there_are_protected_routes() -> None:
    assert PROTECTED


@pytest.mark.parametrize(("route", "method", "roles"), PROTECTED, ids=lambda v: str(v))
def test_anonymous_is_refused(client: Any, route: APIRoute, method: str, roles: Any) -> None:
    response = client.request(method, _url(route), json={})
    assert response.status_code == 401, (method, route.path)


@pytest.mark.parametrize(("route", "method", "roles"), PROTECTED, ids=lambda v: str(v))
def test_editor_refused_on_admin_routes(
    editor_client: Any, route: APIRoute, method: str, roles: Any
) -> None:
    response = editor_client.request(method, _url(route), json={})
    if roles and "editor" not in roles:
        assert response.status_code == 403, (method, route.path)
    else:
        assert response.status_code not in (401, 403), (method, route.path)


@pytest.mark.parametrize(("route", "method", "roles"), PROTECTED, ids=lambda v: str(v))
def test_admin_passes(admin_client: Any, route: APIRoute, method: str, roles: Any) -> None:
    response = admin_client.request(method, _url(route), json={})
    assert response.status_code not in (401, 403), (method, route.path)
