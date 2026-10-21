# Cloudsurfer.aero

Personal aviation CV site (monorepo).

- **`frontend/`** — React + Vite + Tailwind + shadcn/ui (static site for now)
- **`backend/`** — Django API and CMS (planned; not implemented yet)

## Frontend (local development)

From WSL:

```bash
cd frontend
source ~/.nvm/nvm.sh   # if node is not on your PATH
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Production build

```bash
cd frontend
npm run build
```

Output: `frontend/dist/` — upload this folder for static hosting (see `docs/gcp-static-hosting.md`).
