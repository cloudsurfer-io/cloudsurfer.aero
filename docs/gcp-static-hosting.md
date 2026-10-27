# Deprecated: GCS static hosting

Hosting for **cloudsurfer.aero** moved to **Cloud Run** (nginx serving the React build).

Use the step-by-step guide:

**[gcp-cloud-run.md](gcp-cloud-run.md)**

The old flow (public bucket + optional load balancer + `npm run build:gcs`) is retired for this project to reduce cost and align with Django on Cloud Run later.
