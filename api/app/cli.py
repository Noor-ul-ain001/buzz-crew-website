"""Admin CLI. `uv run python -m app.cli create-admin --email you@example.com --name "You"`."""

from typing import Annotated

import typer
from sqlmodel import Session, select

from app.core.database import get_engine
from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.services import auth_service, password_policy

cli = typer.Typer(no_args_is_help=True)


@cli.callback()
def main() -> None:
    """The Buzz Crew API admin commands."""


@cli.command("create-admin")
def create_admin(
    email: Annotated[str, typer.Option(help="Admin's email address")],
    name: Annotated[str, typer.Option(help="Admin's display name")],
    force: Annotated[bool, typer.Option(help="Create even if an admin already exists")] = False,
) -> None:
    """Create the first active admin account."""
    with Session(get_engine()) as session:
        has_admin = session.exec(select(User).where(User.role == UserRole.ADMIN)).first()
        if has_admin and not force:
            typer.echo("An admin already exists. Invite others from /admin/users, or use --force.")
            raise typer.Exit(1)
        if auth_service.find_user(session, email) is not None:
            typer.echo("That email already has an account.")
            raise typer.Exit(1)
        password: str = typer.prompt("Password", hide_input=True, confirmation_prompt=True)
        problems = password_policy.check(password, email)
        if problems:
            typer.echo(" ".join(problems))
            raise typer.Exit(1)
        session.add(
            User(
                email=auth_service.normalise_email(email),
                name=name.strip(),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                password_hash=hash_password(password),
            )
        )
        session.commit()
    typer.echo(f"Admin {email} created. Sign in at /admin/login.")


@cli.command("seed-case-studies")
def seed_case_studies() -> None:
    """Load the agency's real Instagram projects as case studies (removes old samples)."""
    from app.seed_case_studies import seed

    typer.echo(seed())


if __name__ == "__main__":
    cli()
