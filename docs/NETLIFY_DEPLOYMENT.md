# DONIDEX Netlify Deployment

DONIDEX production deployment is managed from GitHub Actions.

- Source of truth: GitHub `main`
- Hosting: Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Required GitHub Actions secret: `NETLIFY_AUTH_TOKEN`
- Netlify site ID: `076a69a0-acf4-4dde-b686-2b0bad66e7b9`

This document is intentionally non-secret and does not contain deployment credentials.
