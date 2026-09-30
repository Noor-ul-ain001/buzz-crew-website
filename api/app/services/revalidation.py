"""Tells the web app to refresh cached pages after content changes (004 T006).

Failures are logged and never raised: pages also refresh on their own within 5 minutes
(`revalidate: 300` on the web side).
"""

import hashlib
import hmac
import json

import httpx
import structlog

from app.core.config import get_settings

log = structlog.get_logger()

SIGNATURE_HEADER = "x-revalidate-signature"


def sign(body: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()


def _send(url: str, body: bytes, signature: str, timeout: float) -> bool:
    response = httpx.post(
        url,
        content=body,
        headers={"content-type": "application/json", SIGNATURE_HEADER: signature},
        timeout=timeout,
    )
    return response.is_success


def revalidate(tags: list[str]) -> None:
    settings = get_settings()
    if not tags:
        return
    if not settings.revalidate_secret:
        log.info("revalidate_skipped", reason="not_configured", tags=tags)
        return
    body = json.dumps({"tags": sorted(set(tags))}).encode("utf-8")
    signature = sign(body, settings.revalidate_secret)
    url = f"{settings.web_url.rstrip('/')}/api/revalidate"
    for attempt in (1, 2):  # one retry
        try:
            if _send(url, body, signature, settings.revalidate_timeout_seconds):
                return
        except httpx.HTTPError as error:
            log.warning("revalidate_error", attempt=attempt, error_type=type(error).__name__)
    log.warning("revalidate_failed", tags=tags)
