# CivicEye

CivicEye is a civic-issue reporting platform. Citizens report problems such as potholes, garbage, water leaks and broken streetlights with a photo, text and location. An AI service classifies each report, and municipal authorities triage the results on a dashboard.

> **Status: early development (MVP foundation).** Authentication, role-based access, the data models and a placeholder AI service are working. Report submission, issue clustering, the map and the authority dashboard are scaffolded but not built yet. See [Project status](#project-status).

## Tech stack

| Layer | Tech |
|---|---|
| Client | React 19, Vite, Tailwind CSS 4, React Router 7, Leaflet / react-leaflet, Axios |
| Server | Node.js 20+, Express 5, Mongoose 9 (MongoDB), JWT, bcryptjs, Zod, Multer, Cloudinary |
| AI service | Python 3.10+, FastAPI, sentence-transformers (`all-MiniLM-L6-v2`) |
| Tests | Node built-in test runner + supertest + mongodb-memory-server; pytest |

## Repository layout

```
civiceye/
├── client/          React single-page app
├── server/          Express REST API (+ seed scripts, tests)
├── ai-service/      FastAPI service (classification + embeddings)
├── sample-data/     Demo users, issues and reports (JSON)
├── docs/            Architecture documentation
└── .github/         CI workflow
```

## Prerequisites

- Node.js 20 or newer and npm
- Python 3.10 or newer
- MongoDB 6+ running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## Setup

```bash
git clone https://github.com/DafneKamalnath/Civiceye.git
cd Civiceye
```

### 1. Server (port 5000)

```bash
cd server
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm install
npm run seed                # creates authority/admin demo accounts
npm run seed:sample         # optional: demo citizens, issues and reports
npm run dev
```

Check it: <http://localhost:5000/api/health> returns `{"status":"ok"}`.

### 2. AI service (port 8000)

```bash
cd ai-service
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The first start downloads the embedding model (about 90 MB). Check it: <http://localhost:8000/health>.

### 3. Client (port 5173)

```bash
cd client
cp .env.example .env         # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

Open <http://localhost:5173>.

### Environment variables

| File | Variable | Purpose |
|---|---|---|
| `server/.env` | `MONGO_URI` | MongoDB connection string |
| | `JWT_SECRET` | Secret for signing tokens (use a long random value) |
| | `CLIENT_URL` | Allowed CORS origin, e.g. `http://localhost:5173` |
| | `PORT` | API port (default 5000) |
| | `AI_SERVICE_URL`, `CLOUDINARY_*` | Planned: AI calls and image uploads |
| `client/.env` | `VITE_API_URL` | Base URL of the API, including `/api` |

## Demo accounts

After `npm run seed` (password for all: `Password123`):

| Email | Role |
|---|---|
| `roads@civiceye.test` | authority (Roads) |
| `water@civiceye.test` | authority (Water) |
| `admin@civiceye.test` | admin |

`npm run seed:sample` adds `asha@civiceye.test` and `ravi@civiceye.test` (citizens). Change these passwords before any real deployment.

## API (current)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | none | Liveness check |
| POST | `/api/auth/register` | none | Create a citizen account `{name, email, password}` |
| POST | `/api/auth/login` | none | Returns `{token, user}` |
| GET | `/api/auth/me` | Bearer token | Current user |

AI service: `GET /health`, `POST /analyze` (multipart form: `text`, optional `image`).

## Sample data

`sample-data/` holds four Chennai-area issues, four reports and two citizens, matching the Mongoose schemas. Load it with `npm run seed:sample` (re-runnable).

## Testing

```bash
# Server: models + auth API against an in-memory MongoDB
cd server && npm install && npm test

# AI service: endpoint tests with the embedding model stubbed
cd ai-service && pip install -r requirements.txt -r requirements-dev.txt && pytest
```

The server tests download a MongoDB binary on first run (cached afterwards). CI runs everything on each push, along with the client lint and build.

## Project status

| Area | State |
|---|---|
| Register / login / JWT / `/me`, role guards | Done |
| Client login, register, protected routes | Done |
| User, Issue and Report models | Done |
| Seed scripts and sample data | Done |
| AI service `/analyze` | Placeholder (fixed `pothole` result, real embeddings) |
| Report submission (form, image upload, geolocation) | Not started |
| Issue clustering / duplicate merge, priority scoring | Not started |
| Map view and authority dashboard | Not started (page stubs only) |
| Status workflow (open, in progress, resolved) | Not started |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)

## Contributing

Issues and pull requests are welcome. Please run the tests and `npm run lint` in `client/` before opening a PR.

## License

[MIT](LICENSE) © 2026 DafneKamalnath
