from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import os

app = FastAPI()

# Autoriser les requêtes depuis le navigateur (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/log")
async def save_log(request: Request):
    data = await request.json()
    with open("diagnostic_report.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return {"status": "success", "file": "diagnostic_report.json"}

if __name__ == "__main__":
    print("SERVEUR DE DIAGNOSTIC DÉMARRÉ sur http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
