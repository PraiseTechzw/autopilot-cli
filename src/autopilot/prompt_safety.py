"""Prompt-boundary safety: never send obvious credentials to an AI provider."""

import re


_SECRET_LINE = re.compile(r"(?im)^(\s*[+\-]?\s*(?:api[_-]?key|password|secret|token|authorization)\s*[:=]\s*)(.+)$")
_PRIVATE_KEY = re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.DOTALL)


def redact_secrets(text: str) -> str:
    text = _PRIVATE_KEY.sub("[REDACTED PRIVATE KEY]", text)
    return _SECRET_LINE.sub(r"\1[REDACTED]", text)
