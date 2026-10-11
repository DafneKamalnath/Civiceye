# CivicEye AI 👁️

> **"From Citizen Complaints to Civic Intelligence."**

CivicEye AI transforms fragmented municipal complaints into real-time, actionable civic intelligence. When citizens report community hazards (potholes, dark streetlights, burst water mains, uncollected garbage, or fallen trees), CivicEye's intelligence layer automatically analyzes, categorizes, deduplicates, prioritizes, and routes them to responsible municipal authorities on a centralized command dashboard.

---

## 🏛️ Core Workflow Loop

$$\text{Capture} \longrightarrow \text{Understand} \longrightarrow \text{Prioritize} \longrightarrow \text{Route} \longrightarrow \text{Resolve}$$

1. **Capture:** Citizens submit geo-tagged incident reports with optional photos and automatic GPS capture.
2. **Understand:** AI vision and NLP parse context, classifying category and estimating severity with graceful fallback.
3. **Prioritize:** A dynamic scoring engine weights severity, cluster duplicate density, ticket age, and proximity to sensitive community hubs (schools, hospitals, transit stations).
4. **Route:** Tickets are automatically dispatched to responsible municipal departments (*Roads, Electricity, Water, Sanitation, Parks, Other*).
5. **Resolve:** Authorities update operational status and upload before-and-after verification photos for civic transparency.

---

## 🏗️ Architecture

```text
  +-------------------------------------------------------------+
  |                   Citizen & Authority Client                |
  |                (React 19 + Vite + Tailwind CSS)             |
  +------------------------------+------------------------------+
                                 |
                                 | HTTPS / REST (JWT Auth)
                                 v
  +-------------------------------------------------------------+
  |                     CivicEye Express API                    |
  |                       (Node.js / ESM)                       |
  |  - Auth & Role Middleware    - Geospatial Deduplication     |
  |  - Dynamic Priority Scorer   - Centralized Error Handling   |
  +--------------+---------------+--------------+---------------+
                 |                              |
                 | HTTP / Multi-part            | Mongoose / Cloudinary
                 v                              v
  +------------------------------+   +--------------------------+
  |      Python AI Service       |   |      Storage Layer       |
  |       (FastAPI + NLP)        |   |                          |
  | - Civic Classification       |   | - MongoDB Atlas          |
  | - Severity & Context Grader  |   |   (Reports & Users)      |
  | - Resilient Keyword Engine   |   | - Cloudinary CDN         |
  +------------------------------+   |   (Before/After Images)  |
                                     +--------------------------+
```

---

## 📦 Services & Tech Stack

| Service | Directory | Tech Stack | Port |
| :--- | :--- | :--- | :--- |
| **Frontend Web Client** | `client/` | React 19, Vite, Tailwind CSS, Leaflet, Axios | `http://localhost:5173` |
| **Backend REST API** | `server/` | Node.js (ESM), Express, Mongoose, Multer, JWT | `http://localhost:5000` |
| **AI Intelligence Engine** | `ai-service/` | Python 3.12+, FastAPI, Uvicorn, Transformers | `http://localhost:8000` |

---

## 🔑 Environment Variables

### Server (`server/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Node.js Express server port | `5000` |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `supersecretjwtkey` |
| `CLIENT_URL` | Allowed CORS origin | `http://localhost:5173` |
| `AI_SERVICE_URL` | Microservice URL for AI NLP step | `http://localhost:8000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud account name | `civiceye-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `secret_token` |
| `ANTHROPIC_API_KEY` | Optional Anthropic LLM API Key | `sk-ant-...` |

### Client (`client/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base REST endpoint for API calls | `http://localhost:5000/api` |

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js** v18+ & **npm**
- **Python** 3.10+ & `pip`
- Active **MongoDB Atlas** cluster URI

---

### 2. Run the AI Service
```bash
cd ai-service
# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# Or install dependencies if setting up clean:
# pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Health Probe:* `http://localhost:8000/health`

---

### 3. Run the Backend API & Seed Database
```bash
cd server
npm install

# Run database seed script (idempotent, safe to run anytime)
node src/seed.js

# Start backend server in development mode
npm run dev
```
*Health Probe:* `http://localhost:5000/api/health`

---

### 4. Run the Client Frontend
```bash
cd client
npm install
npm run dev
```
*Open application:* `http://localhost:5173`

---

## 👥 Demo Credentials

The idempotent seed script (`node src/seed.js`) automatically provisions test accounts and ~15 sample incidents:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Municipal Authority** | `authority@civiceye.test` | `Password123` | Authority Dashboard, Live Map, Status Updates, After-Photo Verification |
| **Citizen Reporter** | `citizen@civiceye.test` | `Password123` | Public Incident Reporting, Geolocation, My Reports Tracking |

*(The login page features 1-click demo buttons for instant access).*

---

## 🧪 Key Features Implemented

- **AI Auto-Categorization & Fallback:** Text and images are analyzed by `ai-service`; if unreachable, seamless keyword heuristics prevent report submission failure.
- **Geospatial Deduplication (`duplicate.js`):** Issues within ~150 meters with matching categories and descriptions increment parent ticket count and priority rather than creating spam tickets.
- **Dynamic Priority Scoring (`priority.js`):** Incorporates severity weight, cluster density, aging factor, and proximity to sensitive zones (schools, hospitals, transit).
- **Interactive Leaflet GIS Map:** Displays color-coded priority pins with click-to-inspect drawers.
- **Before / After Resolution Verification:** Authorities upload proof-of-work photos before marking tickets `resolved`.
