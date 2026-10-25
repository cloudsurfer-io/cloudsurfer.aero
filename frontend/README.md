# Frontend

React aviation CV (Vite, Tailwind, shadcn-style UI). Text and lists live in `src/data/profile.js`.

```bash
source ~/.nvm/nvm.sh
npm install
npm run dev
```

Production: `npm run build` → `dist/` (custom domain). `npm run build:gcs` only for the `storage.googleapis.com/cloudsurfer-aero/...` test URL. See `../docs/gcp-static-hosting.md`.
