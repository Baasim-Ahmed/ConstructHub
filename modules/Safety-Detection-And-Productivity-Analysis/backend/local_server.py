import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = Path(__file__).resolve().parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from safety_module.api import create_app


app = create_app(
    project_root=PROJECT_ROOT,
    runtime_dir=BACKEND_DIR,
    uploads_dir=BACKEND_DIR / "uploads",
    results_dir=BACKEND_DIR / "results",
    ultralytics_dir=BACKEND_DIR / ".ultralytics",
    model_path=PROJECT_ROOT / "FINAL_PT.pt",
)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
