"""Layered Autopilot configuration with no secret persistence by default."""

from dataclasses import asdict, dataclass
import json
import os
from pathlib import Path
import sys
import tomllib


@dataclass(frozen=True)
class AppConfig:
    ai_base_url: str = "https://openrouter.ai/api/v1"
    ai_model: str = "openrouter/free"
    github_api_url: str = "https://api.github.com"
    default_base_branch: str = "main"
    command_timeout_seconds: float = 120.0
    watch_interval_seconds: float = 5.0
    allow_medium: bool = False
    allow_high: bool = False
    ai_configured: bool = False
    github_configured: bool = False
    source: str = "defaults"

    def redacted(self) -> dict[str, object]:
        return asdict(self)


class ConfigError(RuntimeError):
    pass


def config_dir() -> Path:
    override = os.getenv("AUTOPILOT_CONFIG_DIR")
    if override:
        return Path(override).expanduser()
    if sys.platform == "win32":
        return Path(os.getenv("APPDATA", Path.home() / "AppData" / "Roaming")) / "autopilot"
    return Path(os.getenv("XDG_CONFIG_HOME", Path.home() / ".config")) / "autopilot"


def user_config_path() -> Path:
    return config_dir() / "config.toml"


def user_auth_path() -> Path:
    return config_dir() / "auth.json"


def load_user_auth() -> dict[str, str]:
    path = user_auth_path()
    if not path.exists():
        return {}
    try:
        with path.open("r", encoding="utf-8") as stream:
            data = json.load(stream)
    except (OSError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    cleaned: dict[str, str] = {}
    for key, value in data.items():
        if isinstance(key, str) and isinstance(value, str):
            cleaned[key] = value
    return cleaned


def save_user_auth(data: dict[str, str]) -> None:
    path = user_auth_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")


def load_env_file(root: str | Path = ".") -> Path | None:
    """Load simple KEY=VALUE entries from a project .env without overriding the process."""
    path = Path(root).expanduser().resolve() / ".env"
    if not path.exists():
        return None
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise ConfigError(f"cannot read environment file {path}: {exc}") from exc
    for line in lines:
        value = line.strip()
        if not value or value.startswith("#"):
            continue
        if value.startswith("export "):
            value = value[7:].lstrip()
        if "=" not in value:
            continue
        key, raw = value.split("=", 1)
        key, raw = key.strip(), raw.strip()
        if not key or not key.replace("_", "").isalnum():
            continue
        if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in {"'", '"'}:
            raw = raw[1:-1]
        os.environ.setdefault(key, raw)
    return path


def project_config_path(root: str | Path = ".") -> Path:
    return Path(root).expanduser().resolve() / ".autopilot" / "config.toml"


def _read(path: Path) -> dict[str, object]:
    if not path.exists():
        return {}
    try:
        with path.open("rb") as stream:
            data = tomllib.load(stream)
    except (OSError, tomllib.TOMLDecodeError) as exc:
        raise ConfigError(f"cannot read configuration {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise ConfigError(f"configuration must be a TOML table: {path}")
    return data


def load_config(root: str | Path = ".") -> AppConfig:
    values: dict[str, object] = {}
    source = "defaults"
    for path in (user_config_path(), project_config_path(root)):
        data = _read(path)
        if data:
            source = str(path)
            values.update(data.get("autopilot", data))
    env_map: dict[str, tuple[str, type]] = {
        "AI_BASE_URL": ("ai_base_url", str),
        "AUTOPILOT_AI_BASE_URL": ("ai_base_url", str),
        "AI_MODEL": ("ai_model", str),
        "AUTOPILOT_AI_MODEL": ("ai_model", str),
        "GITHUB_API_URL": ("github_api_url", str),
        "AUTOPILOT_GITHUB_API_URL": ("github_api_url", str),
        "AUTOPILOT_DEFAULT_BASE": ("default_base_branch", str),
        "AUTOPILOT_DEFAULT_BASE_BRANCH": ("default_base_branch", str),
        "AUTOPILOT_COMMAND_TIMEOUT": ("command_timeout_seconds", float),
        "AUTOPILOT_COMMAND_TIMEOUT_SECONDS": ("command_timeout_seconds", float),
        "AUTOPILOT_WATCH_INTERVAL": ("watch_interval_seconds", float),
        "AUTOPILOT_WATCH_INTERVAL_SECONDS": ("watch_interval_seconds", float),
    }
    for env_name, (field, converter) in env_map.items():
        if env_name in os.environ:
            try:
                values[field] = converter(os.environ[env_name])
            except ValueError as exc:
                raise ConfigError(f"invalid {env_name}") from exc
    values["ai_configured"] = bool(os.getenv("OPENROUTER_API_KEY") or os.getenv("AI_API_KEY") or os.getenv("AUTOPILOT_AI_API_KEY"))
    values["github_configured"] = bool(os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN") or os.getenv("AUTOPILOT_GITHUB_TOKEN"))
    values["source"] = source
    allowed = {field.name for field in AppConfig.__dataclass_fields__.values()}
    clean = {key: value for key, value in values.items() if key in allowed}
    return AppConfig(**clean)


def config_template() -> str:
    return """# Autopilot project configuration. Secrets belong in environment variables.\n[autopilot]\nai_model = \"openrouter/free\"\nai_base_url = \"https://openrouter.ai/api/v1\"\ngithub_api_url = \"https://api.github.com\"\ndefault_base_branch = \"main\"\ncommand_timeout_seconds = 120.0\nwatch_interval_seconds = 5.0\n"""


def initialize_project_config(root: str | Path = ".", *, overwrite: bool = False) -> Path:
    path = project_config_path(root)
    if path.exists() and not overwrite:
        raise ConfigError(f"configuration already exists: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(config_template(), encoding="utf-8")
    return path
