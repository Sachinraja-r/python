# DataCode Learning Platform (Prototype)

Goal
- A behavioral learning system that turns complete beginners into job-ready data analysts or data engineers using Python.

Phase 1 (Prototype): Editor + Run + Error + Auto-Focus
- Backend: FastAPI with a /execute endpoint that runs Python code via Piston sandbox
- Frontend: Next.js skeleton with a code editor (textarea placeholder) and a run console
- Database: PostgreSQL schema sketch for users, modules, levels, gates, and submissions

How to run (local, phase 1):
- Start Postgres (Docker):
  docker-compose up db
- Start API (backend):
  cd backend
  python -m pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
- Start Frontend (frontend):
  cd frontend
  npm install
  npm run dev

Next steps
- Wire frontend to backend /execute
- Implement authentication scaffolding
- Expand content model (phases, missions, levels, hints)
- Add gating, analytics, and AI mentor hooks

Disclaimer
- This is a scaffold for Phase 1; real deployment will require proper security hardening, input sanitization, and sandbox controls.
