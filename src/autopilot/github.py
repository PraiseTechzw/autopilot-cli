"""GitHub REST operations with explicit caller-controlled side effects."""

from dataclasses import dataclass
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class GitHubError(RuntimeError):
    """Raised for GitHub transport, permission, or response errors."""


@dataclass(frozen=True)
class BranchReference:
    name: str
    sha: str
    url: str


@dataclass(frozen=True)
class PullRequest:
    number: int
    title: str
    url: str
    state: str
    head: str = ""
    base: str = ""


@dataclass(frozen=True)
class WorkflowRun:
    run_id: int
    name: str
    branch: str
    status: str
    conclusion: str | None
    url: str
    head_sha: str

    @property
    def completed(self) -> bool:
        return self.status == "completed"

    @property
    def successful(self) -> bool:
        return self.conclusion == "success"


class GitHubClient:
    def __init__(self, token: str, api_url: str = "https://api.github.com") -> None:
        if not token.strip():
            raise ValueError("GitHub token cannot be empty")
        self.token = token
        self.api_url = api_url.rstrip("/")

    def _request(self, method: str, endpoint: str, payload: dict | None = None) -> dict | list:
        data = json.dumps(payload).encode() if payload is not None else None
        request = Request(
            f"{self.api_url}{endpoint}",
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2026-03-10",
                "Content-Type": "application/json",
            },
        )
        try:
            with urlopen(request, timeout=20) as response:
                result = json.loads(response.read().decode())
        except HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise GitHubError(f"GitHub HTTP {exc.code}: {detail[:500]}") from exc
        except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            raise GitHubError(f"GitHub request failed: {exc}") from exc
        if not isinstance(result, (dict, list)):
            raise GitHubError("GitHub returned an invalid JSON response")
        return result

    def _request_bytes(self, endpoint: str) -> bytes:
        request = Request(f"{self.api_url}{endpoint}", method="GET", headers={"Authorization": f"Bearer {self.token}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10"})
        try:
            with urlopen(request, timeout=30) as response:
                return response.read()
        except HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise GitHubError(f"GitHub HTTP {exc.code}: {detail[:500]}") from exc
        except (URLError, TimeoutError, OSError) as exc:
            raise GitHubError(f"GitHub log request failed: {exc}") from exc

    @staticmethod
    def _validate_repo(owner: str, repo: str) -> None:
        if not owner.strip() or not repo.strip() or "/" in owner or "/" in repo:
            raise ValueError("owner and repo must be simple non-empty names")

    def create_branch(self, owner: str, repo: str, branch: str, sha: str) -> BranchReference:
        self._validate_repo(owner, repo)
        if not branch.strip() or branch.startswith("-") or not sha.strip():
            raise ValueError("branch and sha are required")
        data = self._request("POST", f"/repos/{owner}/{repo}/git/refs", {"ref": f"refs/heads/{branch}", "sha": sha})
        assert isinstance(data, dict)
        try:
            return BranchReference(branch, str(data["object"]["sha"]), str(data["url"]))
        except (KeyError, TypeError) as exc:
            raise GitHubError("GitHub returned an invalid branch response") from exc

    def create_pull_request(self, owner: str, repo: str, title: str, body: str, head: str, base: str = "main", draft: bool = False) -> PullRequest:
        self._validate_repo(owner, repo)
        if not all(value.strip() for value in (title, head, base)):
            raise ValueError("title, head, and base are required")
        data = self._request("POST", f"/repos/{owner}/{repo}/pulls", {"title": title, "body": body, "head": head, "base": base, "draft": draft})
        return self._parse_pr(data)

    def pull_request(self, owner: str, repo: str, number: int) -> PullRequest:
        self._validate_repo(owner, repo)
        if number < 1:
            raise ValueError("PR number must be positive")
        return self._parse_pr(self._request("GET", f"/repos/{owner}/{repo}/pulls/{number}"))

    def workflow_runs(self, owner: str, repo: str, *, branch: str | None = None, head_sha: str | None = None, per_page: int = 10) -> tuple[WorkflowRun, ...]:
        self._validate_repo(owner, repo)
        if not 1 <= per_page <= 100:
            raise ValueError("per_page must be between 1 and 100")
        params = {"per_page": str(per_page)}
        if branch:
            params["branch"] = branch
        if head_sha:
            params["head_sha"] = head_sha
        endpoint = f"/repos/{owner}/{repo}/actions/runs?{urlencode(params)}"
        data = self._request("GET", endpoint)
        if not isinstance(data, dict) or not isinstance(data.get("workflow_runs"), list):
            raise GitHubError("GitHub returned an invalid workflow-runs response")
        runs: list[WorkflowRun] = []
        for item in data["workflow_runs"]:
            if not isinstance(item, dict):
                continue
            try:
                runs.append(WorkflowRun(int(item["id"]), str(item.get("name") or "workflow"), str(item.get("head_branch") or ""), str(item.get("status") or "unknown"), item.get("conclusion"), str(item["html_url"]), str(item["head_sha"])))
            except (KeyError, TypeError, ValueError) as exc:
                raise GitHubError("GitHub returned an invalid workflow-run item") from exc
        return tuple(runs)

    def download_workflow_run_logs(self, owner: str, repo: str, run_id: int) -> bytes:
        self._validate_repo(owner, repo)
        if run_id < 1:
            raise ValueError("run_id must be positive")
        return self._request_bytes(f"/repos/{owner}/{repo}/actions/runs/{run_id}/logs")

    @staticmethod
    def _parse_pr(data: dict | list) -> PullRequest:
        if not isinstance(data, dict):
            raise GitHubError("GitHub returned an invalid pull-request response")
        try:
            return PullRequest(int(data["number"]), str(data["title"]), str(data["html_url"]), str(data["state"]), str(data.get("head", {}).get("ref", "")), str(data.get("base", {}).get("ref", "")))
        except (KeyError, TypeError, ValueError) as exc:
            raise GitHubError("GitHub returned an invalid pull-request response") from exc
