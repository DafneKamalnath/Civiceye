from fastapi import FastAPI, UploadFile, Form
from sentence_transformers import SentenceTransformer

app = FastAPI()
embedder = SentenceTransformer("all-MiniLM-L6-v2")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
async def analyze(text: str = Form(""), image: UploadFile = None):
    # Placeholder result. Replace with a real LLM call in the AI step.
    return {
        "category": "pothole",
        "severity": 3,
        "confidence": 0.5,
        "context": [],
        "duration_days": 0,
        "summary": text[:100],
        "embedding": embedder.encode(text or "empty").tolist(),
    }