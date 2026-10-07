from pathlib import Path

import pytest

TESTS_DIR = Path(__file__).parent
SUITES = ("unit", "integration")


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    """Mark each test as unit or integration based on the folder it lives in.

    Tests outside those folders are rejected, so the CI (which runs each suite
    separately) never leaves a test behind.
    """
    for item in items:
        suite = item.path.relative_to(TESTS_DIR).parts[0]
        if suite not in SUITES:
            raise pytest.UsageError(
                f"{item.nodeid}: every test must live in tests/unit/ or tests/integration/"
            )
        item.add_marker(getattr(pytest.mark, suite))
