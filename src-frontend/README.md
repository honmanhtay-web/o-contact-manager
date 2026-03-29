# O Contact Manager Frontend

Frontend React/Vite app for the self-hosted contact manager backend.

## Requirements

- Node.js 18+
- Backend API running locally or on a reachable host

## Environment

Create `.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=O Contact Manager
```

Notes:

- `VITE_API_BASE_URL` is the default API base URL
- users can override the API base URL at runtime in Settings
- the override is stored in localStorage

## Install

```bash
cd src-frontend
npm install
```

## Scripts

```bash
npm run dev
npm run type-check
npm run lint
npm run build
npm run preview
```

## Local Development

1. Start the backend API from the repo root.
2. Start the frontend:

```bash
cd src-frontend
npm run dev
```

3. Open the local URL printed by Vite.

Default behavior:

- Vite prefers port `5173`
- if the port is already in use, it automatically moves to the next available port

## Current Features

- Infinite contacts list with virtualized A-Z grouping
- List/grid toggle
- Search by name, organization, exact email, and UD key
- Contact detail, create, edit, delete
- Unsaved form leave warning
- JSON and `.vcf` import
- JSON and VCF export
- Stats page with dynamic category breakdown
- PWA build via `vite-plugin-pwa`

## Build Output

```bash
cd src-frontend
npm run build
```

Output is written to:

```text
src-frontend/dist/
```

The production build includes:

- compiled static assets
- generated service worker
- generated web app manifest
- static `public/manifest.json`
- PWA icons in `public/icons/`

## Backend Integration

The frontend expects the backend endpoints documented in:

- [docs/api.http](/h:/nodejs-tester/o-contact-manager/docs/api.http)
- [docs/database-architecture.md](/h:/nodejs-tester/o-contact-manager/docs/database-architecture.md)

Key expectations:

- auth header: `Authorization: Bearer <api-key>`
- health check: `GET /health`
- contacts API rooted at `/contacts`

## Recommended Workflow

```bash
cd h:\nodejs-tester\o-contact-manager
npm run dev
```

In a second terminal:

```bash
cd h:\nodejs-tester\o-contact-manager\src-frontend
npm run dev
```

Then configure the API key in the frontend Settings page.

## Related Docs

- [Frontend Tasks](/h:/nodejs-tester/o-contact-manager/src-frontend/FRONTEND_TASKS.md)
- [Frontend Architecture](/h:/nodejs-tester/o-contact-manager/src-frontend/FRONTEND_ARCHITECTURE.md)
- [Frontend Deployment](/h:/nodejs-tester/o-contact-manager/src-frontend/DEPLOYMENT.md)
