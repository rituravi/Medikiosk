# Medikiosk

Next.js frontend + Django backend + Postgres. Patients can register (capturing clinical
history), log in, and upload physical medical documents (prescriptions, lab reports,
discharge summaries) which are digitized via OCR.

## Prerequisites

- Node.js >= 20.9 (installed here via `brew install node@20`)
- Python 3
- Postgres (installed here via `brew install postgresql@16`, running as a brew service)
- Poppler, for rasterizing scanned PDFs (installed here via `brew install poppler`)
- A `GEMINI_API_KEY` in `backend/.env` — used for document OCR (handwriting-capable, via
  Gemini's vision API) and for parsing spoken registration transcripts ("Fill by voice")

## Backend (Django)

```bash
cd backend
source ../backend_venv/bin/activate   # or create your own venv + pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

API endpoints:

- `GET /api/hello/` -> `{"message": "Hello, World!"}`
- `POST /api/patients/register/` — create a patient account + clinical history, returns an auth token
- `POST /api/patients/login/` — returns an auth token
- `GET /api/patients/me/` — the logged-in patient's profile (requires `Authorization: Token <token>`)
- `GET/POST /api/documents/` — list/upload the logged-in patient's medical documents (multipart form: `document_type`, `title`, `notes`, `file`)
- `GET/DELETE /api/documents/<id>/` — view or delete one of the logged-in patient's documents

Uploaded files are digitized synchronously on upload: PDFs try their embedded text layer
first, and images (plus scanned PDFs with no text layer) are transcribed via the Gemini
vision API, which handles handwritten prescriptions far better than traditional OCR. The
extracted text is stored on the document record.

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
