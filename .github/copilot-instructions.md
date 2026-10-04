# Copilot instructions for CHIRPQt

## Repository shape

This is the Qt rewrite of CHIRP, with a Python application and a large catalog of radio drivers. The code is split between the app shell, common radio abstractions, and vendor-specific driver modules.

- `chirpui.py` is the top-level Qt entry point.
- `src/chirpQt/cli/main.py` is the text/CLI entry point.
- `src/chirpQt/directory.py` imports all drivers and maintains the global driver registry (`DRV_TO_RADIO`).
- `src/chirpQt/drivers/` contains most radio support, one module per family or protocol.
- `src/chirpQt/chirp_common.py` defines the shared `Radio` and related abstractions.
- `src/chirpQt/qtui/` contains the Qt window startup; the UI is intentionally thin.
- `src/tests/` holds pytest tests; UI tests live under `src/tests/ui` and are skip-safe in headless environments.

## Build, test, and lint commands

Use the repo's virtual environment if it already exists in `.venv`:

- Activate: `. .venv/bin/activate`
- Install dependencies: `python -m pip install -r requirements.txt -r test-requirements.txt`

Test commands:

- Run the full suite: `pytest`
- Run a single file: `pytest src/tests/unit/utils/test_memory.py -q`
- Run one test by name: `pytest src/tests/unit/utils/test_memory.py -k create_memory -q`
- GUI tests are configured in `pyproject.toml` and may skip automatically when a display is unavailable (`src/tests/ui/test_main.py`).

Lint/style commands:

- Pre-commit hooks are configured in `.pre-commit-config.yaml` and include whitespace and YAML checks.
- The repo's legacy style check is `python src/tools/cpep8.py <path-or-dir>`.
- Example: `python src/tools/cpep8.py src/chirpQt/utils/memory.py`

There is no dedicated ruff/black configuration in the project; the existing checks are a mix of `pre-commit` hooks and the older `pep8` script.

## High-level architecture

The big picture is a driver-centric radio framework rather than a typical MVC app.

- `directory.import_drivers()` scans `src/chirpQt/drivers/*.py` and imports each module so driver classes register themselves on import.
- Driver classes define radio metadata such as `VENDOR`, `MODEL`, `VARIANT`, and implement the common radio API used by the rest of the app.
- `chirp_common` and the utilities under `src/chirpQt/utils/` provide the shared memory model, settings, and common behavior used by drivers.
- The GUI layer (`qtui`) is a front-end shell; the real work is in the shared radio abstractions and driver implementations.
- `sources/` contains parsers for external data sources and `stock_configs/` provides packaged radio channel templates. These are support modules, not the main app flow.

When changing behavior that spans drivers or the common layer, inspect the radio abstraction classes and the driver registration pattern before patching isolated modules.

## Key conventions specific to this repo

- Driver modules are discovered by import side effects, not by an explicit registry file. New support usually means adding a new module under `src/chirpQt/drivers/` that registers itself with the common directory.
- Most code follows the older CHIRP conventions for driver classes and radio metadata. When adding or modifying a radio implementation, mirror the existing pattern in nearby drivers rather than inventing a new API.
- `Memory` objects and feature metadata are central to how radio settings are modeled; changes in shared `Memory` behavior can ripple across many drivers. Check the common abstractions before making a local assumption.
- The project is Python-first and Qt-based, but the driver layer still uses legacy CHIRP-style interfaces and naming conventions. Avoid treating it as a modern framework app.
- Tests are pytest-based, but the project has a mix of legacy and newer patterns. Use the existing test layout and keep GUI tests skip-safe in headless CI.

## Helpful starting points

- `pyproject.toml` defines the package metadata and pytest configuration.
- `INSTALL` links to the upstream developer environment documentation for Linux setups.
- `README.md` is intentionally minimal; the architecture and workflow are primarily in the package layout and code conventions above.

## Working tips for future sessions

- Prefer targeted searches in `src/chirpQt` and `src/tests` before broad exploration.
- When debugging a radio-specific issue, inspect the driver module and the matching shared API in `chirp_common.py` together.
- When touching the GUI shell, keep it thin; most behavior belongs in the driver/common layers.
- If you need to run a focused verification, prefer a single test file or single test name instead of the entire suite.
