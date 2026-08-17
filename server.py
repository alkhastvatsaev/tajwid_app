#!/usr/bin/env python3
"""Serveur local Tilmidh — FastAPI si dispo, sinon http.server stdlib."""
import json
import os
import sys
import base64
import re
from datetime import datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(ROOT, "public")
RECORDINGS_DIR = os.path.join(ROOT, "recordings")
AUDIT_DIR = os.path.join(RECORDINGS_DIR, "audit")
PORT = int(os.environ.get("PORT", "3000"))
AUDIT_SECRET = os.environ.get("AUDIT_DISPATCH_SECRET") or "tilmidh-local"


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


def _audit_index_path():
    return os.path.join(AUDIT_DIR, "index.json")


def _read_audit_jobs():
    path = _audit_index_path()
    if not os.path.isfile(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and isinstance(data.get("jobs"), list):
            return data["jobs"]
    except Exception:
        return []
    return []


def _write_audit_jobs(jobs):
    os.makedirs(AUDIT_DIR, exist_ok=True)
    with open(_audit_index_path(), "w", encoding="utf-8") as f:
        json.dump({"jobs": jobs}, f, ensure_ascii=False, indent=2)


def _public_audit_job(job):
    if not isinstance(job, dict):
        return None
    return {
        "id": job.get("id"),
        "email": job.get("email"),
        "gender": job.get("gender"),
        "surah": job.get("surah"),
        "surahName": job.get("surahName"),
        "ref": job.get("ref"),
        "status": job.get("status") or "incoming",
        "createdAt": job.get("createdAt"),
        "mimeType": job.get("mimeType"),
        "bytes": job.get("bytes"),
    }


def _save_audit_job(body):
    audio_b64 = _strip_data_url(body.get("audioBase64") or "")
    mime = body.get("mimeType") or "audio/webm"
    email = str(body.get("email") or "").strip().lower()
    gender = body.get("gender") if body.get("gender") in ("woman", "man") else ""
    try:
        surah = int(body.get("surah"))
    except Exception:
        surah = 0
    surah_name = str(body.get("surahName") or "")[:80]
    ref = str(body.get("ref") or "")[:120]
    if not audio_b64:
        return 400, {"error": "audioBase64 required"}
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        return 400, {"error": "email required"}
    if not gender:
        return 400, {"error": "gender required"}
    if surah not in (1, 112, 113, 114):
        return 400, {"error": "short surah only"}
    try:
        audio_raw = base64.b64decode(audio_b64)
    except Exception:
        return 400, {"error": "invalid_base64"}
    if not audio_raw:
        return 400, {"error": "empty audio"}
    os.makedirs(AUDIT_DIR, exist_ok=True)
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    job_id = stamp + "-" + re.sub(r"[^a-z0-9]", "", os.urandom(4).hex())[:6]
    ext = _ext_from_mime(mime)
    audio_name = job_id + "." + ext
    with open(os.path.join(AUDIT_DIR, audio_name), "wb") as f:
        f.write(audio_raw)
    job = {
        "id": job_id,
        "email": email,
        "gender": gender,
        "surah": surah,
        "surahName": surah_name,
        "ref": ref,
        "status": "incoming",
        "paid": False,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "mimeType": mime,
        "bytes": len(audio_raw),
        "localAudio": audio_name,
    }
    with open(os.path.join(AUDIT_DIR, job_id + ".json"), "w", encoding="utf-8") as f:
        json.dump(job, f, ensure_ascii=False, indent=2)
    jobs = _read_audit_jobs()
    jobs.append(job)
    _write_audit_jobs(jobs)
    return 200, {"ok": True, "id": job_id, "status": "incoming"}


def run_stdlib():
    import http.server
    import socketserver

    class TilmidhHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=PUBLIC, **kwargs)

        def do_GET(self):
            path = self.path.split("?", 1)[0]
            if path in ("/", "/index.html", "/d", "/d/"):
                index_path = os.path.join(PUBLIC, "index.html")
                try:
                    with open(index_path, "r", encoding="utf-8") as f:
                        body = f.read().encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                    return
                except OSError:
                    pass
            if path == "/api/audit":
                self._audit_get()
                return
            super().do_GET()

        def do_POST(self):
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b""
            try:
                data = json.loads(raw.decode("utf-8") or "{}")
            except Exception:
                data = {}

            if self.path == "/log":
                with open(os.path.join(ROOT, "diagnostic_report.json"), "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self._json(200, {"status": "success", "file": "diagnostic_report.json"})
                return

            if self.path == "/save-recording":
                audio_b64 = _strip_data_url(data.get("audioBase64") or "")
                mime = data.get("mimeType") or "audio/webm"
                meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}
                if not audio_b64:
                    self._json(400, {"error": "audioBase64 required"})
                    return
                try:
                    audio_raw = base64.b64decode(audio_b64)
                except Exception:
                    self._json(400, {"error": "invalid_base64"})
                    return
                os.makedirs(RECORDINGS_DIR, exist_ok=True)
                stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
                safe = re.sub(r"[^a-zA-Z0-9_-]+", "", stamp)
                ext = _ext_from_mime(mime)
                audio_name = f"fatiha-{safe}.{ext}"
                meta_name = f"fatiha-{safe}.json"
                with open(os.path.join(RECORDINGS_DIR, audio_name), "wb") as f:
                    f.write(audio_raw)
                payload = {
                    **meta,
                    "consent": True,
                    "savedAt": datetime.utcnow().isoformat() + "Z",
                    "localAudio": audio_name,
                }
                with open(os.path.join(RECORDINGS_DIR, meta_name), "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
                self._json(200, {"ok": True, "audioFile": audio_name, "metaFile": meta_name, "dir": "recordings"})
                return

            if self.path.split("?", 1)[0] == "/api/audit":
                code, payload = _save_audit_job(data)
                self._json(code, payload)
                return

            self._json(404, {"error": "not_found"})

        def _audit_get(self):
            from urllib.parse import parse_qs, urlparse
            q = parse_qs(urlparse(self.path).query)
            key = (q.get("key") or [""])[0]
            if key != AUDIT_SECRET:
                self._json(401, {"error": "bad_key"})
                return
            job_id = (q.get("id") or [""])[0]
            file_kind = (q.get("file") or [""])[0]
            jobs = _read_audit_jobs()
            if file_kind == "audio" and job_id:
                job = next((j for j in jobs if j.get("id") == job_id), None)
                if not job or not job.get("localAudio"):
                    self._json(404, {"error": "not_found"})
                    return
                audio_path = os.path.join(AUDIT_DIR, job["localAudio"])
                if not os.path.isfile(audio_path):
                    self._json(404, {"error": "not_found"})
                    return
                with open(audio_path, "rb") as f:
                    raw = f.read()
                self.send_response(200)
                self.send_header("Content-Type", job.get("mimeType") or "audio/webm")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)
                return
            if job_id:
                job = next((j for j in jobs if j.get("id") == job_id), None)
                if not job:
                    self._json(404, {"error": "not_found"})
                    return
                self._json(200, {"ok": True, "job": _public_audit_job(job)})
                return
            self._json(200, {"ok": True, "jobs": [_public_audit_job(j) for j in reversed(jobs) if _public_audit_job(j)]})

        def _json(self, code, payload):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, fmt, *args):
            sys.stderr.write("[stdlib] %s - %s\n" % (self.address_string(), fmt % args))

    print("SERVEUR STDlib sur http://localhost:%s (sans FastAPI)" % PORT)
    print("Enregistrements opt-in → %s" % RECORDINGS_DIR)
    with socketserver.TCPServer(("0.0.0.0", PORT), TilmidhHandler) as httpd:
        httpd.serve_forever()


def run_fastapi():
    from fastapi import FastAPI, Request
    from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn

    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", response_class=HTMLResponse)
    async def read_index():
        with open(os.path.join(PUBLIC, "index.html"), "r", encoding="utf-8") as f:
            return f.read()

    @app.post("/log")
    async def save_log(request: Request):
        data = await request.json()
        with open(os.path.join(ROOT, "diagnostic_report.json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return {"status": "success", "file": "diagnostic_report.json"}

    @app.post("/save-recording")
    async def save_recording(request: Request):
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
        audio_name = "fatiha-%s.%s" % (safe, ext)
        meta_name = "fatiha-%s.json" % safe
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

    @app.post("/api/audit")
    async def audit_post(request: Request):
        try:
            body = await request.json()
        except Exception:
            return JSONResponse({"error": "invalid_json"}, status_code=400)
        code, payload = _save_audit_job(body)
        return JSONResponse(payload, status_code=code)

    @app.get("/api/audit")
    async def audit_get(request: Request):
        key = request.query_params.get("key") or ""
        if key != AUDIT_SECRET:
            return JSONResponse({"error": "bad_key"}, status_code=401)
        job_id = request.query_params.get("id") or ""
        file_kind = request.query_params.get("file") or ""
        jobs = _read_audit_jobs()
        if file_kind == "audio" and job_id:
            job = next((j for j in jobs if j.get("id") == job_id), None)
            if not job or not job.get("localAudio"):
                return JSONResponse({"error": "not_found"}, status_code=404)
            audio_path = os.path.join(AUDIT_DIR, job["localAudio"])
            if not os.path.isfile(audio_path):
                return JSONResponse({"error": "not_found"}, status_code=404)
            return FileResponse(audio_path, media_type=job.get("mimeType") or "audio/webm")
        if job_id:
            job = next((j for j in jobs if j.get("id") == job_id), None)
            if not job:
                return JSONResponse({"error": "not_found"}, status_code=404)
            return {"ok": True, "job": _public_audit_job(job)}
        return {"ok": True, "jobs": [_public_audit_job(j) for j in reversed(jobs) if _public_audit_job(j)]}

    @app.get("/d")
    @app.get("/d/")
    async def audit_dispatch():
        with open(os.path.join(PUBLIC, "index.html"), "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())

    @app.get("/{path:path}")
    async def public_static(path: str):
        candidate = os.path.normpath(os.path.join(PUBLIC, path))
        if not candidate.startswith(PUBLIC):
            return HTMLResponse("Not found", status_code=404)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        html = candidate + ".html"
        if os.path.isfile(html):
            return FileResponse(html)
        return HTMLResponse("Not found", status_code=404)

    print("SERVEUR FastAPI sur http://localhost:%s" % PORT)
    print("Enregistrements opt-in → %s" % RECORDINGS_DIR)
    uvicorn.run(app, host="0.0.0.0", port=PORT)


if __name__ == "__main__":
    try:
        run_fastapi()
    except ImportError:
        run_stdlib()
