# Medikiosk

Next.js frontend + Django backend + Postgres, wired so the homepage fetches "Hello, World!" from the API.

## Prerequisites

- Node.js >= 20.9 (installed here via `brew install node@20`)
- Python 3
- Postgres (installed here via `brew install postgresql@16`, running as a brew service)

## Backend (Django)

```bash
cd backend
source ../backend_venv/bin/activate   # or create your own venv + pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

API: `GET http://localhost:8000/api/hello/` -> `{"message": "Hello, World!"}`

DB connection settings are read from `backend/.env` (Postgres db/user/password `medikiosk` by default).

## Frontend (Next.js)

```bash
cd frontend
npm run dev
```

App: `http://localhost:3000` — fetches from the backend and displays the message.

`NEXT_PUBLIC_API_URL` in `frontend/.env.local` controls the backend URL (defaults to `http://localhost:8000`).

## Database (Postgres)

A `docker-compose.yml` is included for running Postgres via Docker if preferred:

```bash
docker compose up -d
```

Locally, Postgres was instead installed via Homebrew:

```bash
brew services start postgresql@16
```
