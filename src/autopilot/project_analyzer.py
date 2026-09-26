"""Deterministic project inspection used as context for later AI features."""

from dataclasses import dataclass
from pathlib import Path
import re


@dataclass(frozen=True)
class ProjectProfile:
    root: Path
    languages: tuple[str, ...] = ()
    frameworks: tuple[str, ...] = ()
    package_managers: tuple[str, ...] = ()
    test_frameworks: tuple[str, ...] = ()
    ci_systems: tuple[str, ...] = ()
    important_files: tuple[str, ...] = ()
    architecture: tuple[str, ...] = ()
    dependencies: tuple[str, ...] = ()
    entrypoints: tuple[str, ...] = ()
    conventions: tuple[str, ...] = ()


class ProjectAnalyzer:
    """Scan filenames and small config files without executing project code."""

    LANGUAGE_BY_SUFFIX = {".py": "Python", ".js": "JavaScript", ".ts": "TypeScript", ".go": "Go", ".rs": "Rust", ".java": "Java", ".rb": "Ruby"}

    def __init__(self, root: str | Path = ".") -> None:
        self.root = Path(root).expanduser().resolve()

    def analyze(self) -> ProjectProfile:
        files = [p for p in self.root.rglob("*") if p.is_file() and ".git" not in p.parts]
        languages = {self.LANGUAGE_BY_SUFFIX[p.suffix.lower()] for p in files if p.suffix.lower() in self.LANGUAGE_BY_SUFFIX}
        names = {p.name for p in files}
        frameworks: set[str] = set()
        package_managers: set[str] = set()
        tests: set[str] = set()
        ci: set[str] = set()
        dependencies: set[str] = set()
        if "pyproject.toml" in names or "requirements.txt" in names:
            package_managers.add("pip")
        if "package.json" in names:
            package_managers.add("npm")
        if "go.mod" in names:
            package_managers.add("go modules")
        if "Cargo.toml" in names:
            package_managers.add("Cargo")
        for p in files:
            if p.name in {"requirements.txt", "pyproject.toml", "package.json", "go.mod", "Cargo.toml"}:
                text = p.read_text(errors="ignore")
                dependencies.update(re.findall(r"(?m)^\s*([A-Za-z][\w.-]+)(?:\s*[=<>~])", text)[:50])
        if "pytest.ini" in names or "tox.ini" in names or (self.root / "tests").is_dir() or any(p.name.startswith("test_") for p in files):
            tests.add("pytest")
        if "package.json" in names:
            tests.add("JavaScript test runner")
        if any("django" in p.read_text(errors="ignore").lower() for p in files if p.name in {"requirements.txt", "pyproject.toml"}):
            frameworks.add("Django")
        if any("fastapi" in p.read_text(errors="ignore").lower() for p in files if p.name in {"requirements.txt", "pyproject.toml"}):
            frameworks.add("FastAPI")
        if (self.root / ".github" / "workflows").is_dir():
            ci.add("GitHub Actions")
        if (self.root / ".gitlab-ci.yml").exists():
            ci.add("GitLab CI")
        important_names = {"README.md", "pyproject.toml", "package.json", "Dockerfile", "docker-compose.yml", ".env.example"}
        important = sorted(str(p.relative_to(self.root)) for p in files if p.name in important_names or ".github/workflows" in str(p.relative_to(self.root)))
        architecture = tuple(name for name in ("src", "app", "lib", "tests", "docs", ".github") if (self.root / name).exists())
        entrypoint_names = {"main.py", "app.py", "__main__.py", "index.js", "index.ts", "server.py", "manage.py"}
        entrypoints = tuple(sorted(str(p.relative_to(self.root)) for p in files if p.name in entrypoint_names))
        conventions = tuple(sorted(name for name in ("README.md", ".editorconfig", "pyproject.toml", "package.json", "CONTRIBUTING.md") if (self.root / name).exists()))
        return ProjectProfile(self.root, tuple(sorted(languages)), tuple(sorted(frameworks)), tuple(sorted(package_managers)), tuple(sorted(tests)), tuple(sorted(ci)), tuple(important), architecture, tuple(sorted(dependencies)), entrypoints, conventions)
