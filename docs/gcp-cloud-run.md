# Hosting on Google Cloud Run (cloudsurfer.aero)

This guide is for **you to follow by hand**. Nothing here runs automatically from the repo. Each step explains **what** you do, **why** it matters, and how it fits the bigger picture.

**Goal today:** put your React CV on **Cloud Run** at **https://cloudsurfer.aero**, with low cost at low traffic.

**Goal later:** add a **second** Cloud Run service for **Django** and **Cloud SQL (Postgres)**. The frontend and API stay **separate services** (not one container).

---

## How the pieces fit together

```text
Phase 1 (now)
  Browser → cloudsurfer.aero (DNS) → Cloud Run "frontend" → nginx → your built React files

Phase 2 (later)
  Browser → cloudsurfer.aero → React app
  React   → api.cloudsurfer.aero → Cloud Run "backend" → Django → Cloud SQL
```

**Why Cloud Run for the static site?**

- Your React app is only **files** after `npm run build` (HTML, JS, CSS, images). Cloud Run does not “run React” — it runs a small **web server** (nginx) that **sends those files** to visitors.
- You get **HTTPS** and **custom domains** without a **global load balancer + public bucket**, which is costly for a personal site.
- **Scale to zero:** with `--min-instances 0`, you pay little when nobody visits.
- **Same platform** as Django later: one mental model (containers + `gcloud run deploy`).

**Why not put Django and React in one container now?**

You could, but two services are clearer: change the CV without rebuilding Django; scale API and site independently. This repo keeps `frontend/` and `backend/` separate on purpose.

---

## What you will add to the repo (when you are ready)

These files are **not** in the repo until you create them. Copy from the sections below.

| File | Role |
|------|------|
| `frontend/Dockerfile` | Builds the React app, then copies `dist/` into an nginx image. |
| `frontend/nginx.conf` | Tells nginx how to serve files and fall back to `index.html` (for future client-side routes). |
| `frontend/.dockerignore` | Keeps `node_modules` and local `dist` out of the Docker build context (the image builds fresh `dist` inside). |

**Vite:** use `base: '/'` in `frontend/vite.config.js` (production at domain root). You can remove `npm run build:gcs` and the `gcs` mode once you no longer use the old bucket URL.

**Asset paths:** keep `photo: 'images/portrait.jpg'` in `profile.js` (no leading `/`) and use `` `${import.meta.env.BASE_URL}${profile.photo}` `` in `Hero.jsx`.

---

## Step 0 — Prerequisites

**Why:** Cloud Run deploy needs a GCP project, billing, and tools on your machine.

1. **WSL** (you already use this), **Node** via nvm, **Docker** (Docker Desktop with WSL integration, or Docker in WSL).
2. **gcloud** logged in as the account that owns project **`cloudsurfer`**:

   ```bash
   gcloud auth login
   gcloud config set project cloudsurfer
   gcloud config set run/region europe-west1
   ```

3. **Billing** linked to the project (Cloud Run and Artifact Registry need it).

4. **Docker** can push images:

   ```bash
   docker version
   gcloud auth configure-docker europe-west1-docker.pkg.dev
   ```

---

## Step 1 — Enable APIs (one time per project)

**Why:** Google disables most services until you turn them on explicitly.

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

(`cloudbuild.googleapis.com` is optional if you only build images **on your laptop** and push them — that is what this guide assumes.)

---

## Step 2 — Create an Artifact Registry repository (one time)

**Why:** Cloud Run does not build from your folder by magic. It runs a **container image**. You store that image in **Artifact Registry** (like a private Docker Hub in your project).

```bash
gcloud artifacts repositories create cloudsurfer-aero \
  --repository-format=docker \
  --location=europe-west1 \
  --description="cloudsurfer.aero containers"
```

Your image path will look like:

`europe-west1-docker.pkg.dev/cloudsurfer/cloudsurfer-aero/frontend:latest`

- `europe-west1` — region  
- `cloudsurfer` — GCP project id  
- `cloudsurfer-aero` — Artifact Registry **repository** name (matches the git repo folder; hyphens only — no `.`)  
- `frontend` — **image** name inside that repository  
- `latest` — tag (you can use version tags later)

---

## Step 3 — Create `nginx.conf`

**Why:** nginx is a fast web server. It serves `index.html` and files under `/assets/` and `/images/`. For a React SPA, unknown paths should return `index.html` so refreshes on future routes still work.

Create `frontend/nginx.conf`:

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

**Why port 8080:** Cloud Run sends traffic to the container on the port defined by the `PORT` environment variable (default **8080**). nginx must listen on that port.

---

## Step 4 — Create `Dockerfile` (multi-stage build)

**Why two stages?**

1. **Build stage:** needs Node to run `npm run build`. That image is large; you do not ship it to production.
2. **Run stage:** only nginx + the contents of `dist/`. Small and secure.

Create `frontend/Dockerfile`:

```dockerfile
# --- Stage 1: build React ---
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: serve with nginx ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
```

Create `frontend/.dockerignore`:

```text
node_modules
dist
.git
*.md
```

---

## Step 5 — Build and test the image locally (recommended)

**Why:** Catch Dockerfile mistakes before paying for a failed Cloud Run deploy.

From `frontend/`:

```bash
npm run build   # optional check; Docker also runs build inside the image
docker build -t cloudsurfer-aero:local .
docker run --rm -p 8080:8080 cloudsurfer-aero:local
```

Open **http://localhost:8080**. You should see your CV. Stop the container with Ctrl+C.

---

## Step 6 — Push the image to Artifact Registry

**Why:** Cloud Run pulls the image from Google's registry in your project.

```bash
cd frontend
docker tag cloudsurfer-aero:local \
  europe-west1-docker.pkg.dev/cloudsurfer/cloudsurfer-aero/frontend:latest

docker push europe-west1-docker.pkg.dev/cloudsurfer/cloudsurfer-aero/frontend:latest
```

If push fails with “denied”, run `gcloud auth configure-docker europe-west1-docker.pkg.dev` again.

---

## Step 7 — Deploy to Cloud Run (first time)

**Why each flag:**

| Flag | Meaning |
|------|--------|
| `--image` | Which container to run. |
| `--region europe-west1` | Where the service runs (match your registry region). |
| `--allow-unauthenticated` | Anyone on the internet can **invoke** the service (public website). |
| `--min-instances 0` | Scale to zero when idle (save money). |
| `--memory 256Mi` | Enough for nginx serving static files. |
| `--port 8080` | Must match nginx `listen` port. |

```bash
gcloud run deploy cloudsurfer-aero \
  --image europe-west1-docker.pkg.dev/cloudsurfer/cloudsurfer-aero/frontend:latest \
  --region europe-west1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --memory 256Mi \
  --port 8080
```

When it finishes, gcloud prints a URL like:

`https://cloudsurfer-aero-xxxxx.europe-west1.run.app`

Open it. **This is your site on Cloud Run** before custom DNS.

### If deploy fails with IAM / organization policy

You may see errors about **`allUsers`** (similar to the Storage bucket). Your Workspace org may restrict **Domain restricted sharing**. Fix: **project-level override** for project `cloudsurfer` only (same idea as for the bucket), so this service can be public. Do not turn off org-wide security for all projects.

---

## Step 8 — Map custom domain `cloudsurfer.aero`

**Why:** Visitors should use your domain, not the `run.app` URL. Cloud Run can provision a **Google-managed TLS certificate** once DNS proves you control the name.

**Console (easiest while learning):**

1. Cloud Run → service **cloudsurfer-aero** → **Manage custom domains**.
2. Add **cloudsurfer.aero** and **www.cloudsurfer.aero**.
3. Copy the **DNS records** Google shows (often A/AAAA and/or CNAME depending on setup).
4. At your **domain registrar**, add those records. Lower TTL while testing.
5. Wait until the certificate status is **ACTIVE** (often 15–60+ minutes after DNS is correct).

**CLI (alternative):**

```bash
gcloud run domain-mappings create \
  --service cloudsurfer-aero \
  --domain cloudsurfer.aero \
  --region europe-west1
```

Follow the DNS instructions in the command output.

**Check DNS:**

```bash
dig cloudsurfer.aero +short
```

---

## Step 9 — Deploy loop (every time you change the site)

**Why:** Cloud Run runs an **image snapshot**. Editing files on your laptop does not change production until you build a **new image** and deploy it.

```bash
cd frontend
# edit src/data/profile.js or components...
docker build -t cloudsurfer-aero:local .
docker tag cloudsurfer-aero:local \
  europe-west1-docker.pkg.dev/cloudsurfer/cloudsurfer-aero/frontend:latest
docker push europe-west1-docker.pkg.dev/cloudsurfer/cloudsurfer-aero/frontend:latest

gcloud run deploy cloudsurfer-aero \
  --image europe-west1-docker.pkg.dev/cloudsurfer/cloudsurfer-aero/frontend:latest \
  --region europe-west1
```

You can skip repeating flags Cloud Run already stored on the service.

**Git:** committing is for your history; deploy uses whatever is **on disk** when you `docker build`.

---

## Step 10 — Old GCS bucket (optional cleanup)

If you used **`gs://cloudsurfer-aero`** earlier, you can stop rsyncing to it. After Cloud Run + domain work, delete the bucket or keep it private for backups — it is no longer the primary hosting path.

---

## Later — Django on a second Cloud Run service

**Not in this guide’s steps yet.** When you add Django in `backend/`:

1. **Cloud SQL** instance (Postgres) — ongoing cost while the instance exists.
2. **Second service** e.g. `cloudsurfer-api` from `backend/Dockerfile` (gunicorn).
3. **Domain** e.g. `api.cloudsurfer.aero` → domain mapping on the API service.
4. **Frontend:** set `VITE_API_URL=https://api.cloudsurfer.aero` in `.env.production`, rebuild the **frontend image**, redeploy `cloudsurfer-aero`.
5. **Django:** `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` include your real origins.

See [backend/README.md](../backend/README.md) for local Django setup when you start.

---

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| Blank page | Browser DevTools → Network. Are `/assets/*.js` and `.css` **200**? Wrong `base` in Vite or old image still deployed. |
| 403 on `run.app` URL | Service not public; `--allow-unauthenticated` or org IAM policy. |
| Domain cert stuck | DNS not pointing at Google’s records; wait and re-check `dig`. |
| Image works locally, fails on Run | Wrong architecture (rare on WSL); push the image you built; check Cloud Run logs. |
| Cold start delay | First request after idle may be slower with `min-instances 0`; normal for a CV site. |

---

## Cost mindset (low traffic)

- **Cloud Run:** pay mainly for requests and short CPU time; **min-instances 0** keeps idle cost low.
- **Artifact Registry:** small storage cost per image.
- **Cloud SQL (later):** the main fixed cost when you add Django — pick the smallest tier for learning.
- **Avoid:** global HTTPS load balancer + backend bucket for a static-only site unless you have a specific reason.

---

## Related docs

- Local dev: [README.md](../README.md)
- Full-stack learning template (Notion): **How to Full-stack 101** — updated to match this Cloud Run frontend approach.
