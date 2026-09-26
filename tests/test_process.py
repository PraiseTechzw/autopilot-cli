import sys

import pytest

from autopilot.process import CommandError, run_command


def test_command_timeout_is_structured():
    with pytest.raises(CommandError, match="timed out"):
        run_command([sys.executable, "-c", "import time; time.sleep(1)"], timeout=0.01)


def test_missing_executable_is_structured():
    with pytest.raises(CommandError, match="No such file"):
        run_command(["autopilot-command-that-does-not-exist"])
