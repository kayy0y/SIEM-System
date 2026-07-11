# SIEM System — AI-Powered Threat Detection

## What This Is
A full-stack Security Information and Event Management (SIEM) system with:
- AI threat detection using Isolation Forest + Random Forest
- Real-time dashboard with charts
- Log upload and parsing (Linux, Apache, Nginx, CSV, JSON)
- Alert management with block/investigate/safe actions
- PDF incident report generation
- SIEM comparison module vs Splunk, Sentinel, QRadar
- JWT authentication with Admin/Analyst roles

---

## Quick Start (Windows)

### Option 1: Double-click to run
1. Double-click `start.bat`
2. Wait ~60 seconds for both servers to start
3. Open http://localhost:3000

### Option 2: Manual (if start.bat fails)

**Terminal 1 — Backend:**
```
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```
cd frontend
npm install
npm start
```

---

## Default Login Credentials
| Username | Password   | Role    |
|----------|-----------|---------|
| admin    | admin123  | Admin   |
| analyst  | analyst123| Analyst |

---

## How to Test

1. Login at http://localhost:3000
2. Go to **Upload Logs**
3. Upload the file at `logs/sample_linux.log`
4. Go to **Dashboard** — you'll see threats and charts
5. Go to **Alerts** — investigate, block, or mark safe
6. Go to **Threat Detection** — see ML model metrics
7. Go to **Reports** — download PDF
8. Go to **SIEM Comparison** — see how it compares

---

## Tech Stack
| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React.js, Recharts, Lucide Icons    |
| Backend   | Python, FastAPI, Uvicorn            |
| Database  | SQLite (zero setup)                 |
| ML        | Scikit-learn, Isolation Forest, Random Forest |
| Auth      | JWT (JSON Web Tokens), RBAC         |
| Reports   | ReportLab (PDF generation)          |

---

## API Documentation
Once backend is running, visit:
http://localhost:8000/docs

This gives you an interactive Swagger UI showing all API endpoints.

---

## Folder Structure
```
SIEM-System/
├── backend/
│   ├── main.py          ← All API routes (FastAPI)
│   ├── database.py      ← SQLite models (SQLAlchemy)
│   ├── auth.py          ← JWT authentication
│   ├── log_parser.py    ← Log parsing engine
│   ├── ml_engine.py     ← AI/ML threat detection
│   ├── report_generator.py ← PDF reports
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/       ← Dashboard, Alerts, Upload, etc.
│   │   ├── components/  ← Sidebar, StatCard, SeverityBadge
│   │   ├── context/     ← Auth state management
│   │   └── utils/       ← Axios API client
│   └── package.json
├── logs/
│   └── sample_linux.log ← Test this first
└── start.bat            ← One-click launcher
```

---

## Common Issues

**Backend port already in use:**
```
python -m uvicorn main:app --reload --port 8001
```
Then change `baseURL` in `frontend/src/utils/api.js` to `http://localhost:8001`

**npm not found:**
Install Node.js from https://nodejs.org

**pip not found:**
Use `python -m pip install -r requirements.txt`

**CORS error in browser:**
Make sure backend is running on port 8000 before opening frontend.
