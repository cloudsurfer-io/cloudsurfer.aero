# Frontend

React aviation CV (Vite, Tailwind, shadcn-style UI). Text and lists live in `src/data/profile.js`.

```bash
source ~/.nvm/nvm.sh
npm install
npm run dev
```

Production: `npm run build` → `dist/` inside a Docker image (nginx on Cloud Run). See [../docs/gcp-cloud-run.md](../docs/gcp-cloud-run.md).
