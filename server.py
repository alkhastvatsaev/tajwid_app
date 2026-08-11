from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import os
import base64
import re
from datetime import datetime

app = FastAPI()

RECORDINGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recordings")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("public/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/log")
async def save_log(request: Request):
    data = await request.json()
    with open("diagnostic_report.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return {"status": "success", "file": "diagnostic_report.json"}

def _strip_data_url(b64: str) -> str:
    if not b64:
        return ""
    if b64.startswith("data:") and "," in b64:
        return b64.split(",", 1)[1]
    return b64

def _ext_from_mime(mime: str) -> str:
    m = (mime or "").lower()
    if "mp4" in m or "m4a" in m or "aac" in m:
        return "mp4"
    if "ogg" in m:
        return "ogg"
    if "wav" in m:
        return "wav"
    if "mpeg" in m or "mp3" in m:
        return "mp3"
    return "webm"

@app.post("/save-recording")
async def save_recording(request: Request):
    """Opt-in dataset: écrit recordings/{stamp}.webm + .json"""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "invalid_json"}, status_code=400)

    audio_b64 = _strip_data_url(body.get("audioBase64") or "")
    mime = body.get("mimeType") or "audio/webm"
    meta = body.get("meta") if isinstance(body.get("meta"), dict) else {}

    if not audio_b64:
        return JSONResponse({"error": "audioBase64 required"}, status_code=400)

    try:
        raw = base64.b64decode(audio_b64)
    except Exception:
        return JSONResponse({"error": "invalid_base64"}, status_code=400)

    if not raw:
        return JSONResponse({"error": "empty audio"}, status_code=400)

    os.makedirs(RECORDINGS_DIR, exist_ok=True)
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    safe = re.sub(r"[^a-zA-Z0-9_-]+", "", stamp)
    ext = _ext_from_mime(mime)
    audio_name = f"fatiha-{safe}.{ext}"
    meta_name = f"fatiha-{safe}.json"
    audio_path = os.path.join(RECORDINGS_DIR, audio_name)
    meta_path = os.path.join(RECORDINGS_DIR, meta_name)

    with open(audio_path, "wb") as f:
        f.write(raw)

    payload = {
        **meta,
        "consent": True,
        "savedAt": datetime.utcnow().isoformat() + "Z",
        "localAudio": audio_name,
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return {
        "ok": True,
        "audioFile": audio_name,
        "metaFile": meta_name,
        "dir": "recordings",
    }

@app.get("/{path:path}")
async def public_static(path: str):
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
    candidate = os.path.normpath(os.path.join(root, path))
    if not candidate.startswith(root):
        return HTMLResponse("Not found", status_code=404)
    if os.path.isfile(candidate):
        return FileResponse(candidate)
    html = candidate + ".html"
    if os.path.isfile(html):
        return FileResponse(html)
    return HTMLResponse("Not found", status_code=404)

if __name__ == "__main__":
    print("SERVEUR DE DIAGNOSTIC DÉMARRÉ sur http://localhost:3000")
    print(f"Enregistrements opt-in → {RECORDINGS_DIR}")
    uvicorn.run(app, host="0.0.0.0", port=3000)
