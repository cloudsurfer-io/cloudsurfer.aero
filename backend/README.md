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
