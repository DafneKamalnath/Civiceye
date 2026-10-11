import re
import hashlib
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI(title="CivicEye AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CATEGORY_DEPARTMENT_MAP = {
    "pothole": "Roads",
    "road": "Roads",
    "streetlight": "Electricity",
    "water": "Water",
    "garbage": "Sanitation",
    "tree": "Parks",
    "other": "Other",
}

def generate_quick_embedding(text: str, dim: int = 384) -> list[float]:
    """Fast deterministic pseudo-embedding vector for similarity comparisons without model download."""
    if not text:
        return [0.0] * dim
    # Hash-based projection
    words = text.lower().split()
    vec = [0.0] * dim
    for w in words:
        h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    norm = sum(x * x for x in vec) ** 0.5
    return [round(x / norm, 4) for x in vec] if norm > 0 else vec

@app.get("/health")
def health():
    return {"status": "ok", "service": "civiceye-ai-service"}

@app.post("/analyze")
async def analyze(request: Request):
    text = ""
    # Support both multipart form-data and application/json
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            text = body.get("text", "")
        except Exception:
            text = ""
    else:
        try:
            form = await request.form()
            text = str(form.get("text", "") or "")
        except Exception:
            text = ""

    clean_text = text.strip()
    lower_text = clean_text.lower()

    # 1. Civic Category Classification
    category = "other"
    if re.search(r"\b(pothole|crater|pavement|asphalt|sinkhole|rut|bump)\b", lower_text):
        category = "pothole"
    elif re.search(r"\b(street\s*light|light\s*pole|dark|lamp|blackout|bulb|wire|sparking|electricity|pole)\b", lower_text):
        category = "streetlight"
    elif re.search(r"\b(water|pipe|leak|burst|sewage|drain|drainage|overflow|flooding|manhole|hydrant|tap)\b", lower_text):
        category = "water"
    elif re.search(r"\b(garbage|trash|waste|dump|bin|litter|refuse|stench|rotting|debris)\b", lower_text):
        category = "garbage"
    elif re.search(r"\b(tree|branch|fallen tree|roots|foliage|leaves|timber|bush|bough)\b", lower_text):
        category = "tree"
    elif re.search(r"\b(road|sidewalk|curb|divider|traffic|crosswalk|guardrail|barrier)\b", lower_text):
        category = "road"

    # 2. Severity Classification
    severity = "medium"
    if re.search(r"\b(urgent|danger|hazard|severe|deep|massive|emergency|hospital|accident|fire|sparking|flooding|burst|critical|injury)\b", lower_text):
        severity = "high"
    elif re.search(r"\b(minor|small|slight|cosmetic|tiny|flickering|dim)\b", lower_text):
        severity = "low"

    # 3. Department Routing
    department = CATEGORY_DEPARTMENT_MAP.get(category, "Other")

    # 4. Context Extraction
    context = []
    if re.search(r"\b(school|kindergarten|college|university|student)\b", lower_text):
        context.append("school")
    if re.search(r"\b(hospital|clinic|ambulance|emergency|nursing home|health)\b", lower_text):
        context.append("hospital")

    # 5. Summary
    if clean_text:
        summary = clean_text if len(clean_text) <= 100 else clean_text[:97] + "..."
    else:
        summary = f"Civic report identified as {category} issue"

    embedding = generate_quick_embedding(clean_text)

    return {
        "category": category,
        "severity": severity,
        "department": department,
        "summary": summary,
        "context": context,
        "confidence": 0.92 if category != "other" else 0.50,
        "embedding": embedding,
    }