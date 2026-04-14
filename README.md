# ChainPulse

Predict. Prevent. Deliver.

ChainPulse is a full-stack supply chain intelligence platform for live shipment tracking, risk scoring, disruption simulation, and operational visibility.

## What You Get

- Live shipment location updates over Socket.IO
- ML-assisted risk scoring and route-level risk assessment
- Disruption simulation with affected-radius impact and cancel/rollback support
- Dashboard analytics and shipment lifecycle management
- Supabase-based frontend authentication flow

## Tech Stack

- Frontend: React 18, Vite, TailwindCSS, Leaflet, Socket.IO client
- Backend: FastAPI, SQLAlchemy (async), Uvicorn, Socket.IO server
- Data: PostgreSQL + Redis
- ML: scikit-learn + XGBoost model artifacts in backend app ml folder
- Auth: Supabase client flow in frontend

## Project Structure

```text
ChainGuard/
     chainpulse-backend/     FastAPI API, WebSocket events, ML risk model
     chainpulse-frontend/    React dashboard, auth pages, maps, simulator UI
     docker-compose.yml      Main local orchestration (frontend + backend + db + redis)
     .env.example            Environment variable template
```

## Prerequisites

- Docker Desktop (recommended for quickest run)
- Or local runtimes:
     - Python 3.11+
     - Node.js 20+
     - PostgreSQL 15+
     - Redis 7+

## Environment Setup

1. Create local env file from template.
2. Fill the values with your local/hosted services.

```powershell
cd ChainGuard
copy .env.example .env
```

Suggested .env values for local Docker setup:

```env
DATABASE_URL="Your Database URL"
REDIS_URL="REDIS URL"
NEWS_API_KEY="YOUR NEWS API KEY"
OPENROUTE_API_KEY="YOUR OPNEROUTE API KEY"
DEBUG=true
```

Notes:
- The provided .env.example currently has placeholder values that are not directly runnable.
- If you run backend outside Docker, use localhost in URLs instead of service names.

## Run With Docker (Recommended)

From the project root:

```powershell
cd ChainGuard
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Run Locally Without Docker

### 1) Start backend

```powershell
cd ChainGuard/chainpulse-backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Start frontend

```powershell
cd ChainGuard/chainpulse-frontend
npm install
npm run dev
```

Frontend dev server runs at http://localhost:3000 and proxies API requests to http://localhost:8000.

## Authentication Setup (Supabase)

The frontend imports a Supabase client module and expects project credentials. Ensure your frontend environment is configured for Supabase auth.

Typical frontend env variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Also configure redirect URLs in your Supabase project to include local routes such as:
- http://localhost:3000/auth/callback
- http://localhost:3000/verify-email
- http://localhost:3000/complete-profile

## API Overview

Base URL: http://localhost:8000

Core endpoints:

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | /health | Health check |
| GET | /api/shipments | List shipments (supports owner_email query) |
| POST | /api/shipments | Create shipment |
| GET | /api/shipments/{tracking_id} | Get shipment |
| PUT | /api/shipments/{tracking_id}/status | Update status/location/risk |
| DELETE | /api/shipments/{tracking_id} | Delete shipment |
| GET | /api/shipments/{tracking_id}/route | Route and alternates |
| POST | /api/predictions/assess | Assess shipment risk |
| GET | /api/predictions/dashboard-stats | Dashboard aggregates |
| GET | /api/alerts | List alerts (placeholder response) |
| POST | /api/disruptions/simulate | Trigger simulated disruption |
| POST | /api/disruptions/{disruption_id}/cancel | Cancel simulated disruption |

## Real-Time Socket Events

Socket server: http://localhost:8000

Incoming events used by frontend:
- shipment_update
- risk_assessment
- new_disruption
- disruption_cleared
- alert

## Data and ML Notes

- Backend auto-creates tables at startup when database is reachable.
- Demo shipment seed data is created for default owner demo@chainpulse.local.
- Model assets are stored in chainpulse-backend app ml.

## Troubleshooting

- Frontend cannot connect to backend:
     - Verify backend is running on port 8000.
     - Check Vite proxy config and browser network logs.
- Database connection errors:
     - Confirm DATABASE_URL matches your runtime network (Docker service names vs localhost).
- No live updates on dashboard:
     - Confirm Socket.IO connection reaches backend and websocket traffic is not blocked.
- Docker build fails on frontend:
     - Ensure package-lock.json exists and is committed (Dockerfile expects it).

## Useful Commands

```powershell
# Build and run all services
docker compose up --build

# Stop services
docker compose down

# Follow backend logs
docker compose logs -f backend

# Follow frontend logs
docker compose logs -f frontend
```
