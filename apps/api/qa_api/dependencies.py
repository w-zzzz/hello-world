"""Request-scoped dependencies for the Quant Academy API.

M0 ships an auth stub that always resolves to ``None``. M3 will replace
``get_current_user`` with a Clerk JWKS validator that parses the bearer
token, verifies the RS256 signature, and returns a typed user principal.
"""

from __future__ import annotations


async def get_current_user() -> None:
    """Return the current authenticated user.

    Stub for M0 — returns ``None`` so endpoints can be exercised without
    auth wiring. TODO(M3): replace with Clerk JWKS validator that returns
    a ``UserPrincipal`` parsed from the ``Authorization: Bearer <jwt>``
    header.
    """

    return None
