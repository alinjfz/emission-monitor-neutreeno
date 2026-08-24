"""Authentication request validation and safe public user shape."""

from typing import Annotated

from pydantic import EmailStr, Field, StringConstraints, field_validator

from app.schemas.common import ApiModel

Password = Annotated[str, StringConstraints(min_length=4, max_length=128)]


class RegisterRequest(ApiModel):
    """Registration input normalized before account creation."""

    name: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    email: EmailStr
    password: Password

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        """Collapse internal whitespace and reject an effectively empty name."""
        stripped = " ".join(value.split())
        if not stripped:
            raise ValueError("Name is required.")
        return stripped

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        """Canonicalize string email input before EmailStr validation."""
        return value.strip().lower() if isinstance(value, str) else value


class LoginRequest(ApiModel):
    """Login input; errors intentionally do not reveal which credential failed."""

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        """Canonicalize login email input before credential lookup."""
        return value.strip().lower() if isinstance(value, str) else value


class UserOut(ApiModel):
    id: int
    name: str
    email: EmailStr
    role: str
