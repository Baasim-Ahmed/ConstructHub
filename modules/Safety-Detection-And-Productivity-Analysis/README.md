# Automated Construction Site Supervision System

This project analyzes construction-site videos and produces a simple dashboard for safety and productivity review.

The app can:

- upload a site video,
- detect construction activities and safety items using the included AI model,
- analyze worker movement,
- count work activity,
- show dashboard charts and a processed result video.

## Quick Start

### What You Need

This project is prepared for Windows.

Before running it, make sure the computer has:

1. Internet connection for the first setup.
2. Python 3.12 installed.
3. Google Chrome or Microsoft Edge.

Node.js does not need to be installed manually. If Node.js is missing, the start script downloads a portable local copy inside this project folder.

Important: the setup does not install project libraries globally. It creates local folders such as `.venv`, `node_modules`, and `.tools` inside this project folder only.

## Creating The Zip File

If you are preparing this project for someone else, double-click:

```text
Create-Handoff-Zip.bat
```

It creates a clean zip file and leaves out machine-specific folders like `.venv`, `node_modules`, `.tools`, `logs`, and temporary result videos.

Send the generated `Safety-Detection-And-Productivity-Analysis-handoff.zip` file.

## How To Run

1. Extract the zip file.
2. Open the extracted project folder.
3. Double-click `Start-Project.bat`.
4. Wait for the setup window to finish.
5. The browser should open automatically.

If the browser does not open, manually open:

```text
http://127.0.0.1:3000
```

The first run can take several minutes because it prepares the frontend and backend dependencies locally. Later runs are faster.

## How To Close

Double-click:

```text
Stop-Project.bat
```

This closes both the dashboard and the local AI backend.

## Sign In

The app uses Clerk authentication. When the browser opens, sign in first. After signing in, the upload screen appears.

## How To Test A Video

1. Click `Upload`.
2. Choose or upload a construction-site video.
3. Wait while the backend analyzes the video.
4. Click `View Analysis` to open the processed video.
5. Use the sidebar to view dashboard charts:
   - Dashboard
   - Counts
   - Safety Analysis Chart
   - Productivity Analysis Chart
   - Arm Movement Chart
   - Shoulder Movement Chart

Processing time depends on video length and computer speed.

## What The Included Files Do

- `Start-Project.bat` starts everything.
- `Stop-Project.bat` closes everything.
- `backend/local_server.py` runs the local AI backend.
- `safety_module` contains the reusable Python package for integration into another project.
- `FINAL_PT.pt` is the included AI model file.
- `src` contains the dashboard application.
- `backend/results` is created automatically for processed videos.
- `backend/uploads` is created automatically for uploaded/downloaded videos.
- `logs` is created automatically for troubleshooting.

## If Something Goes Wrong

### The browser does not open

Open this link manually:

```text
http://127.0.0.1:3000
```

### The app says the backend is unavailable

Run:

```text
Stop-Project.bat
```

Then run:

```text
Start-Project.bat
```

### Python 3.12 is missing

Install Python 3.12 from:

```text
https://www.python.org/downloads/release/python-312/
```

Then run `Start-Project.bat` again.

### Port already in use

The project uses:

- frontend: `127.0.0.1:3000`
- backend: `127.0.0.1:5000`

If another app is already using those ports, close that app and run `Start-Project.bat` again.

### Need logs

Look inside the `logs` folder:

- `backend.err.log`
- `backend.out.log`
- `frontend.err.log`
- `frontend.out.log`

These files are useful if a developer needs to inspect what happened.

## Reusable Package

You can now reuse the backend as a Python package instead of copying the old single-file Flask server.

### Files To Copy Into Another Project

Copy these into the parent project:

```text
safety_module/
FINAL_PT.pt
requirements.txt
```

Optional but useful if you want package-style install metadata:

```text
pyproject.toml
```

### Automation Helpers

If you want to copy this project into another repo with the same UI and install dependencies:

```text
Install-Into-HostProject.ps1
```

If you want Codex to do the copy inside the target project, use:

```text
CODEX_COPY_THIS_PROJECT_PROMPT.md
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Direct Python Usage

Use this if your other project already has a Python backend:

```python
from safety_module import analyze_video

result = analyze_video(
    video_path="C:/videos/site-footage.mp4",
    model_path="C:/my-project/FINAL_PT.pt",
    runtime_dir="C:/my-project/.safety_module",
)

data = result.to_dict()
print(data["summary"])
print(data["result_video_path"])
```

You can pass either:

- `video_path="...local file path..."`
- `video_url="https://..."`

### Flask Sidecar Usage

Use this if your main project is not Python-based and you want a small API service:

```python
from safety_module import create_app

app = create_app(
    model_path="C:/my-project/FINAL_PT.pt",
    runtime_dir="C:/my-project/.safety_module",
)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
```

### API Request Format

Preferred request body:

```json
{
  "video_url": "https://example.com/video.mp4"
}
```

or:

```json
{
  "video_path": "C:/videos/site-footage.mp4"
}
```

Legacy compatibility is still kept for the old frontend:

```json
{
  "imageUrl": "https://example.com/video.mp4"
}
```

### Default File Layout In The Host Project

If you only copy the package and model file, the package will look for the model in one of these places:

```text
<host-project>/models/FINAL_PT.pt
<host-project>/FINAL_PT.pt
```

By default, runtime files are written under:

```text
<host-project>/.safety_module/
```

You can override those paths with:

- `model_path=...`
- `runtime_dir=...`
- `uploads_dir=...`
- `results_dir=...`
- `ultralytics_dir=...`

## Developer Notes

The original backend was stored in the Jupyter notebook. For easy handoff, this package includes a normal local Flask backend at `backend/local_server.py`.

If you want to integrate this project into another application as a reusable module, see:

```text
INTEGRATION_PLAN.md
```

The frontend talks to the backend at:

```text
http://127.0.0.1:5000/upload
```

The frontend is served locally at:

```text
http://127.0.0.1:3000
```
