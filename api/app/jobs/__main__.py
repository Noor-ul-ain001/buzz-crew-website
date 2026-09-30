import sys
from collections.abc import Callable

from app.jobs import auth_jobs, content_jobs

JOBS: dict[str, Callable[[], int]] = {
    "prune_login_attempts": auth_jobs.prune_login_attempts,
    "cleanup_media": content_jobs.cleanup_media,
}


def main(argv: list[str]) -> int:
    if len(argv) != 1 or argv[0] not in JOBS:
        print(f"usage: python -m app.jobs {{{'|'.join(JOBS)}}}", file=sys.stderr)
        return 2
    removed = JOBS[argv[0]]()
    print(f"{argv[0]}: {removed} rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
