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

    @staticmethod
    def _env(*names: str) -> str | None:
        for name in names:
            value = os.getenv(name)
            if value is not None and value != "":
                return value
        return None

    @classmethod
    def from_env(cls) -> "ProviderConfig | None":
        key = cls._env("OPENROUTER_API_KEY", "AI_API_KEY", "AUTOPILOT_AI_API_KEY")
        if not key:
            return None
        return cls(
            api_key=key,
            base_url=cls._env("AI_BASE_URL", "AUTOPILOT_AI_BASE_URL", "OPENAI_BASE_URL") or "https://openrouter.ai/api/v1",
            model=cls._env("AI_MODEL", "AUTOPILOT_AI_MODEL") or "openrouter/free",
            app_title=cls._env("AI_APP_TITLE", "AUTOPILOT_AI_APP_TITLE") or "Autopilot",
            referer=cls._env("AI_HTTP_REFERER", "AUTOPILOT_AI_HTTP_REFERER"),
            timeout=float(cls._env("AI_TIMEOUT", "AUTOPILOT_AI_TIMEOUT") or "45"),
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
