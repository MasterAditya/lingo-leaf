"""Password hashing primitives for the future cookie-session authentication flow."""

import bcrypt


def hash_password(password: str) -> str:
    """Hash a password with bcrypt; callers must validate password policy separately."""
    encoded_password = password.encode("utf-8")
    if len(encoded_password) > 72:
        raise ValueError("Passwords must be 72 bytes or fewer for bcrypt.")
    return bcrypt.hashpw(encoded_password, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Safely verify a plaintext password against its stored bcrypt hash."""
    encoded_password = password.encode("utf-8")
    if len(encoded_password) > 72:
        return False
    return bcrypt.checkpw(encoded_password, password_hash.encode("utf-8"))
