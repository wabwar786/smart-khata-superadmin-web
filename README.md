# Smart Khata Super Admin Portal

A professional web portal for controlling the Smart Khata SaaS platform.

It connects to the live Railway API:

```text
https://smart-khata-production.up.railway.app
```

## Included modules

- Super admin login
- Dashboard KPI cards
- Platform overview chart
- Businesses list/search
- Block/unblock business
- Subscription payments list
- Approve subscription payment
- Reject subscription payment
- Subscription plans view
- Setup guide
- GitHub Pages deployment workflow
- Optional Railway deployment config

## Important

This is a frontend portal only. It uses your existing Smart Khata API and PostgreSQL database.

The login user must have `is_super_admin = true` in PostgreSQL.

## Make a user Super Admin

Open Railway → Postgres → Data → Query and run:

```sql
UPDATE app_users
SET is_super_admin = TRUE
WHERE LOWER(email) = LOWER('ahmed@example.com');
```

Replace `ahmed@example.com` with your real admin email.

Then login in the portal using that email/password.

## GitHub Pages deployment

1. Create a GitHub repo, for example:

```text
smart-khata-superadmin-web
```

2. Upload this project to GitHub.

3. Go to repo → Settings → Pages.

4. Under Source, select:

```text
GitHub Actions
```

5. Go to Actions → Deploy Super Admin Portal → Run workflow.

6. After success, open the GitHub Pages URL.

## Railway deployment option

If you want to deploy this portal on Railway instead of GitHub Pages:

1. Create a new Railway service from this repo.
2. Add variable:

```text
VITE_API_BASE_URL=https://smart-khata-production.up.railway.app
```

3. Railway will run:

```bash
npm run build
npm start
```

## Local run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## API variable

Default API URL is already set. To change it, set:

```text
VITE_API_BASE_URL=https://your-api-url.up.railway.app
```
