# Frontend Deployment Guide

Deployment guide for the Vite-built frontend application.

## 1. Build

```bash
cd src-frontend
npm install
npm run build
```

Build artifacts are generated in:

```text
src-frontend/dist/
```

## 2. Environment Strategy

This app uses `VITE_API_BASE_URL` at build time as the default backend URL.

Example:

```bash
VITE_API_BASE_URL=https://api.contacts.example.com npm run build
```

Users can still override the API base URL later from the Settings page.

## 3. Static Hosting Options

### Option A: Nginx

Copy `dist/` to your web root, for example:

```bash
scp -r dist/* user@server:/var/www/o-contact-manager/
```

Example Nginx config:

```nginx
server {
    listen 80;
    server_name contacts.example.com;

    root /var/www/o-contact-manager;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option B: Static Hosting Platform

You can deploy `dist/` to:

- Netlify
- Vercel
- Firebase Hosting
- Cloudflare Pages
- GitHub Pages with SPA fallback support

Required behavior:

- serve `index.html` for unknown app routes
- keep static asset caching enabled

## 4. Backend Requirements

The frontend must be able to reach:

- `GET /health`
- `GET /contacts`
- `GET /contacts/meta/stats`
- all other `/contacts/*` routes used by the UI

If frontend and backend are on different origins:

- configure backend CORS correctly
- make sure the browser can reach the API host directly

## 5. Production Checklist

- Build completed successfully
- Backend API is reachable from the browser
- API key authentication works
- SPA route fallback is configured
- HTTPS is enabled
- Service worker and manifest are served correctly

## 6. Smoke Test

After deployment:

1. Open the site
2. Go to Settings
3. Enter API base URL
4. Test connection
5. Save API key
6. Verify:
   - contacts list loads
   - search works
   - import/export buttons render
   - stats page loads

## 7. PWA Notes

The manifest and service worker are generated during build by `vite-plugin-pwa`.

Production output includes:

- `manifest.webmanifest`
- `manifest.json`
- `registerSW.js`
- `sw.js`

To validate:

- open browser devtools
- check Application → Manifest
- confirm service worker is installed

## 8. Suggested URLs

- Frontend: `https://contacts.example.com`
- Backend API: `https://api.contacts.example.com`

If you deploy under the same origin path, make sure the backend routes do not conflict with the SPA host.
