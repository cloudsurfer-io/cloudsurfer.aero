# Backend (Django) — planned

This folder will hold the Django project later:

- REST API for aviation CV content (replacing hardcoded `frontend/src/data/profile.js`)
- Admin / in-page editing and user accounts

**Not started in phase 1.** When we add Django:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install django djangorestframework
django-admin startproject config .
```

Keep the virtual environment inside `backend/.venv` (do not commit it).

## Production (planned)

Django will run as a **second Cloud Run service** (e.g. `cloudsurfer-api`), not in the same container as the React site.

- **Frontend:** Cloud Run service `cloudsurfer-aero` — image `cloudsurfer-aero/frontend` in Artifact Registry (see [../docs/gcp-cloud-run.md](../docs/gcp-cloud-run.md)).
- **API:** `cloudsurfer-api` — gunicorn + Django, connected to **Cloud SQL (Postgres)**.
- **DNS:** `cloudsurfer.aero` → web service; `api.cloudsurfer.aero` → API service (typical pattern).

The React app will call the API with `VITE_API_URL` at build time.
