# Static hosting on Google Cloud

Phase 1 publishes only the built frontend. Django is not deployed yet.

## 1. Build

From WSL, in this repo:

```bash
source ~/.nvm/nvm.sh
cd frontend
npm install
npm run build
```

The site is the folder `frontend/dist/`.

## 2. Bucket

You need a Google Cloud project and the `gcloud` CLI signed in (`gcloud auth login` and `gcloud config set project YOUR_PROJECT`).

```bash
gcloud storage buckets create gs://YOUR_BUCKET_NAME --location=europe-west1 --uniform-bucket-level-access
gcloud storage buckets update gs://YOUR_BUCKET_NAME --web-main-page-suffix=index.html --web-error-page=index.html
gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME --member=allUsers --role=roles/storage.objectViewer
gcloud storage rsync frontend/dist gs://YOUR_BUCKET_NAME --recursive --delete-unmatched-destination-objects
```

The public URL is:

`https://storage.googleapis.com/YOUR_BUCKET_NAME/index.html`

A custom domain (`cloudsurfer.aero`) and HTTPS need Cloud Load Balancing or a CDN in front of the bucket. That step waits until the domain DNS is under your control.

Later, the Django API can run on Cloud Run while this bucket (or Cloud CDN) keeps serving the React build.
