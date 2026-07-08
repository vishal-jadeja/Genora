class ProviderAuthError(Exception):
    """BYOK key is invalid, revoked, or lacks permission for this model."""


class ProviderRateLimitError(Exception):
    """Provider reported rate limiting or quota exhaustion."""


class ProviderBadRequestError(Exception):
    """Provider rejected the request itself (bad model name, malformed params)."""
