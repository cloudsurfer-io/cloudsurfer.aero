# Static hosting on Google Cloud

Phase 1 publishes only the built frontend. Django is not deployed yet.

## Build paths (`base` in Vite)

Assets and `index.html` use a **base path** so URLs resolve correctly.

| Target | Command | Vite `base` | Use when |
|--------|---------|-------------|----------|
| **Custom domain** (`https://cloudsurfer.aero/`) | `npm run build` | `/` | Production (load balancer + DNS) |
| **Bucket URL only** | `npm run build:gcs` | `/cloudsurfer-aero/` | Testing without a domain: `https://storage.googleapis.com/cloudsurfer-aero/index.html` |

After changing content or `base`, always **build** then **rsync** (see below).

Public files (e.g. portrait) should use paths **without** a leading slash in `profile.js` (`images/portrait.jpg`), combined with `import.meta.env.BASE_URL` in components.

## 1. Build

From WSL, in this repo:

```bash
source ~/.nvm/nvm.sh
cd frontend
npm install
npm run build          # for cloudsurfer.aero (root base)
# npm run build:gcs    # only if testing via storage.googleapis.com/BUCKET/...
```

Output: `frontend/dist/`.

Verify `dist/index.html` references `/assets/...` (domain) or `/cloudsurfer-aero/assets/...` (GCS URL test build).

## 2. Bucket

Project example: `cloudsurfer`. Bucket example: `cloudsurfer-aero`.

You need the `gcloud` CLI signed in (`gcloud auth login`, `gcloud config set project cloudsurfer`).

```bash
gcloud storage buckets create gs://cloudsurfer-aero --location=europe-west1 --uniform-bucket-level-access
gcloud storage buckets update gs://cloudsurfer-aero --web-main-page-suffix=index.html --web-error-page=index.html
```

### Public read (`allUsers`)

```bash
gcloud storage buckets add-iam-policy-binding gs://cloudsurfer-aero \
  --member=allUsers --role=roles/storage.objectViewer
```

If you get **HTTP 412** (“do not belong to a permitted customer”), your **organization** blocks `allUsers`. In Cloud Console → **IAM & Admin → Organization policies**, for project `cloudsurfer` only, override **Domain restricted sharing** (and **Public access prevention** on Storage if required) so this bucket can be public. Keep org-wide restrictions on other projects.

## 3. Upload

From `frontend/` after a successful build:

```bash
gcloud storage rsync dist gs://cloudsurfer-aero --recursive --delete-unmatched-destination-objects
```

Wait until the command **finishes**. There is no extra “propagation” delay on GCS; if the site looks wrong, check browser cache (hard refresh or private window) or an incomplete rsync.

**Check what is live:**

```bash
gcloud storage cat gs://cloudsurfer-aero/index.html | head -15
```

### Bucket-only URL (optional test)

`https://storage.googleapis.com/cloudsurfer-aero/index.html` — only works if you built with `npm run build:gcs`.

## 4. Custom domain and HTTPS (`cloudsurfer.aero`)

You cannot point DNS at `storage.googleapis.com` for a branded apex domain with TLS. Use a **global external HTTPS load balancer** with a **backend bucket** and a **Google-managed SSL certificate**.

```text
Browser → DNS (A record) → Load balancer (443) → Backend bucket → gs://cloudsurfer-aero
```

Expect a **monthly cost** for the load balancer (forwarding rules), plus small traffic charges. Cloud CDN on the backend bucket is optional.

### 4.1 Before going live on the domain

1. Use **`npm run build`** (`base: '/'`), not `build:gcs`.
2. Rsync `dist/` to the bucket.

### 4.2 GCP setup (Console)

In project **cloudsurfer**:

1. **Reserve a global static IPv4**  
   Network services → IP addresses → Reserve external (global). Example name: `cloudsurfer-aero-ip`.

2. **Backend bucket**  
   Load balancing → Backends → Create backend bucket → bucket `cloudsurfer-aero`. Optional: enable Cloud CDN.

3. **Load balancer**  
   Create → Application Load Balancer (HTTP/S) → **Global** → backend bucket above as default backend.

4. **Managed certificate**  
   Include hostnames: `cloudsurfer.aero` and `www.cloudsurfer.aero`.

5. **Forwarding rules**  
   - HTTPS on port **443** to the HTTPS proxy (cert + URL map).  
   - HTTP on port **80** with redirect to HTTPS (recommended).

Attach the reserved **global IP** to the forwarding rules.

Certificate status stays **PROVISIONING** until DNS points at that IP (often 15–60+ minutes after DNS is correct).

### 4.3 DNS (registrar)

| Type | Name | Value |
|------|------|--------|
| A | `@` (apex) | Global load balancer IPv4 |
| A or CNAME | `www` | Same IP, or CNAME to `cloudsurfer.aero` if your registrar allows |

Lower TTL while testing. Confirm:

```bash
dig cloudsurfer.aero +short
dig www.cloudsurfer.aero +short
```

When the certificate is **ACTIVE**, open `https://cloudsurfer.aero` (private window). JS/CSS should load from `/assets/...`, images from `/images/...`.

### 4.4 Deploy updates (domain live)

Same as always:

```bash
cd frontend
npm run build
gcloud storage rsync dist gs://cloudsurfer-aero --recursive --delete-unmatched-destination-objects
```

If you enable Cloud CDN, you may need to invalidate cached objects after HTML changes (or set shorter cache on `index.html` later).

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Blank page; CSS requested from `https://storage.googleapis.com/assets/...` | Old `index.html` in browser cache, or build/rsync mismatch. Use `gcloud storage cat` on `index.html`; hard refresh. |
| Blank page on bucket URL | Built with `npm run build` (`base: '/'`) but opened via `storage.googleapis.com/BUCKET/...` — use `npm run build:gcs` for that URL, or use the custom domain. |
| Image URL with `//images/...` | Leading `/` on path in `profile.js` while using `BASE_URL` (use `images/portrait.jpg`). |
| `allUsers` IAM 412 | Organization policy; project-level override for the website project only. |

## Later

Django API on **Cloud Run** + database; this bucket (or CDN) keeps serving the React build. API on a subdomain (e.g. `api.cloudsurfer.aero`) is a common split.
