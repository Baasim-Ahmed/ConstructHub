import cv2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
from fastapi.middleware.cors import CORSMiddleware
import logging

# Set up logging so we can see errors in the terminal
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model ONCE at startup
try:
    model = YOLO("FINAL_PT.pt")
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")

class VideoRequest(BaseModel):
    video_url: str

@app.get("/")
def health_check():
    return {"status": "online", "model_loaded": model is not None}

@app.post("/analyze")
async def analyze_video(request: VideoRequest):
    try:
        video_url = request.video_url
        cap = cv2.VideoCapture(video_url)
        
        if not cap.isOpened():
            return {"success": False, "error": "Could not open video URL"}

        # Use the model's own names to avoid IndexErrors
        names = model.names
        peak_counts = {"hardhats": 0, "vests": 0, "workers": 0}

        frame_count = 0
        while True:
            success, img = cap.read()
            if not success:
                break
            
            frame_count += 1
            # Process every 10th frame to keep it fast
            if frame_count % 10 != 0:
                continue

            results = model(img, stream=True, verbose=False)
            
            frame_hardhats = 0
            frame_vests = 0
            frame_workers = 0

            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    label = names.get(cls_id, "").lower()

                    if "hardhat" in label or "hard hat" in label:
                        frame_hardhats += 1
                    elif "vest" in label:
                        frame_vests += 1
                    elif "worker" in label or "person" in label:
                        frame_workers += 1

            # Update Peaks
            peak_counts["hardhats"] = max(peak_counts["hardhats"], frame_hardhats)
            peak_counts["vests"] = max(peak_counts["vests"], frame_vests)
            peak_counts["workers"] = max(peak_counts["workers"], frame_workers)

        cap.release()

        # Calculate a simple safety score
        score = 100
        if peak_counts["workers"] > 0:
            # Penalty for missing gear
            missing_hardhats = max(0, peak_counts["workers"] - peak_counts["hardhats"])
            score = max(0, 100 - (missing_hardhats * 20))

        return {
            "success": True,
            "safety_score": score,
            "details": peak_counts
        }

    except Exception as e:
        logger.error(f"Analysis Error: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)