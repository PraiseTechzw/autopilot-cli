"""Real AI provider adapters with a dependency-free OpenAI-compatible client."""

from dataclasses import dataclass
import json
import os
from typing import Any, Protocol, Sequence
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class AIProviderError(RuntimeError):
    """Raised when an AI provider cannot complete a request."""


@dataclass(frozen=True)
class ChatMessage:
    role: str
    content: str


class AIProvider(Protocol):
    def complete(self, messages: Sequence[ChatMessage], *, response_format: dict[str, Any] | None = None) -> str:
        ...


@dataclass(frozen=True)
class ProviderConfig:
    api_key: str
    base_url: str = "https://openrouter.ai/api/v1"
    model: str = "openrouter/free"
    app_title: str = "Autopilot"
    referer: str | None = None
    timeout: float = 45.0

    @classmethod
    def from_env(cls) -> "ProviderConfig | None":
        key = os.getenv("OPENROUTER_API_KEY") or os.getenv("AI_API_KEY")
        if not key:
            return None
        return cls(
            api_key=key,
            base_url=os.getenv("AI_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/"),
            model=os.getenv("AI_MODEL", "openrouter/free"),
            app_title=os.getenv("AI_APP_TITLE", "Autopilot"),
            referer=os.getenv("AI_HTTP_REFERER"),
            timeout=float(os.getenv("AI_TIMEOUT", "45")),
        )


class OpenAICompatibleProvider:
    """Chat-completions client for OpenRouter, OpenAI, or compatible gateways."""

    def __init__(self, config: ProviderConfig) -> None:
        if not config.api_key.strip():
            raise ValueError("AI API key cannot be empty")
        self.config = config

    def complete(self, messages: Sequence[ChatMessage], *, response_format: dict[str, Any] | None = None) -> str:
        if not messages:
            raise ValueError("at least one message is required")
        payload: dict[str, Any] = {
            "model": self.config.model,
            "messages": [{"role": message.role, "content": message.content} for message in messages],
            "temperature": 0.1,
        }
        if response_format is not None:
            payload["response_format"] = response_format
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "X-OpenRouter-Title": self.config.app_title,
        }
        if self.config.referer:
            headers["HTTP-Referer"] = self.config.referer
        request = Request(f"{self.config.base_url}/chat/completions", data=json.dumps(payload).encode(), headers=headers, method="POST")
        try:
            with urlopen(request, timeout=self.config.timeout) as response:
                data = json.loads(response.read().decode())
        except HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise AIProviderError(f"provider HTTP {exc.code}: {detail[:500]}") from exc
        except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            raise AIProviderError(f"provider request failed: {exc}") from exc
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise AIProviderError("provider returned an invalid chat-completion response") from exc
        if not isinstance(content, str) or not content.strip():
            raise AIProviderError("provider returned empty content")
        return content.strip()


def configured_provider() -> OpenAICompatibleProvider | None:
    config = ProviderConfig.from_env()
    return OpenAICompatibleProvider(config) if config else None
