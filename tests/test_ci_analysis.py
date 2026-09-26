from io import BytesIO
from zipfile import ZipFile

from autopilot.ci_analysis import CIFailureAnalyzer
from autopilot.github import WorkflowRun


def zipped_logs(text: str) -> bytes:
    stream = BytesIO()
    with ZipFile(stream, "w") as bundle:
        bundle.writestr("job/step.txt", text)
    return stream.getvalue()


def test_ci_failure_analysis_extracts_logs_and_files():
    run = WorkflowRun(4, "CI", "feature", "completed", "failure", "https://run/4", "sha")

    class FakeGitHub:
        def download_workflow_run_logs(self, owner, repo, run_id):
            return zipped_logs("ERROR tests/test_app.py:12\nTraceback: failure\n")

    report = CIFailureAnalyzer(FakeGitHub()).analyze("acme", "demo", run)
    assert report.suspected_files == ("tests/test_app.py",)
    assert report.failed_lines
    assert report.findings[0].severity == "HIGH"


def test_ci_failure_analysis_rejects_successful_or_pending_runs():
    analyzer = CIFailureAnalyzer(object())
    successful = WorkflowRun(1, "CI", "main", "completed", "success", "", "sha")
    pending = WorkflowRun(2, "CI", "main", "in_progress", None, "", "sha")
    for run in (successful, pending):
        try:
            analyzer.analyze("a", "b", run)
        except ValueError as exc:
            assert "completed unsuccessful" in str(exc)
        else:
            raise AssertionError("expected validation failure")
