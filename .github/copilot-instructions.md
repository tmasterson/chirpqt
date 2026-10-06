# Copilot instructions for CHIRPQt

## Build, test, and lint

Use `.venv` when present:

- Activate it with `. .venv/bin/activate`.
- Install dependencies with `python -m pip install -r requirements.txt -r test-requirements.txt`.
- Install the package for the browser UI with `python -m pip install -e .`.
- Run the full test suite with `pytest`.
- Run a test file with `pytest src/tests/unit/webui/test_api.py -q` or a single test with `pytest src/tests/unit/webui/test_api.py -k test_open_edit_and_save_csv_image -q`.
- Run the configured hooks with `pre-commit run --all-files`.
- Run the legacy style checker on changed paths with `python src/tools/cpep8.py <path-or-dir>`.

The experimental browser UI starts with `chirpqt-web` after editable installation and binds to `http://127.0.0.1:8765`.

## Architecture

CHIRPQt is a driver-centric radio framework with a local browser interface. `src/chirpQt/directory.py` imports driver modules; their import-time registration populates `DRV_TO_RADIO`. Drivers in `src/chirpQt/drivers/` implement shared radio interfaces and identify models through metadata such as `VENDOR`, `MODEL`, and `VARIANT`.

`src/chirpQt/chirp_common.py` defines the common radio, memory, feature, file-image, and clone-mode abstractions used by drivers. The browser layer is a client of those abstractions: `src/chirpQt/webui/api.py` defines the FastAPI endpoints, `service.py` owns the in-process radio session and transfer work, and `static/` contains the frontend. It does not implement an independent radio model.

## Repository-specific conventions

- Follow nearby driver implementations and existing CHIRP interfaces when adding or changing radio support. Registration is an import side effect, not a separate manually maintained registry.
- Treat `RadioFeatures` and each radio's validation rules as the contract for editable memory fields and values. A field supported by one model is not necessarily supported by another.
- The web service is a single-user local tool bound to loopback. Host/origin checks and explicit confirmation for replacing unsaved images or uploading to a radio are intentional security and data-loss safeguards; preserve them when changing the API.
- Web API tests use FastAPI's `TestClient` and CSV-backed images, so they run without radio hardware. Transfer tests can fake serial devices; real clone transfers require compatible hardware.
- The browser interface works with local radio images and CSV channel lists; it is experimental and is not intended for remote hosting.
