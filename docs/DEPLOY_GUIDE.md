# Deploy Guide

## Option A: Deploy on GitHub Pages

This is recommended because you do not need another server for the web portal.

### Steps

1. Create a new GitHub repository.
2. Upload all files from this folder.
3. Go to GitHub repository → Settings → Pages.
4. Select source: GitHub Actions.
5. Go to Actions tab.
6. Run: Deploy Super Admin Portal.
7. Open the generated GitHub Pages URL.

## Option B: Deploy on Railway

Use this only if you want a Railway URL for the portal.

1. Create a new Railway service from this repository.
2. Add environment variable:

```text
VITE_API_BASE_URL=https://smart-khata-production.up.railway.app
```

3. Deploy.

Railway will build the Vite app and serve the `dist` folder.

## Required API setting

In your Smart Khata API service, keep CORS enabled:

```text
CORS_ORIGIN=*
```

or set it to your portal URL.

## Super Admin SQL

Before login, promote your admin user:

```sql
UPDATE app_users
SET is_super_admin = TRUE
WHERE LOWER(email) = LOWER('ahmed@example.com');
```

Then login using that email/password.
