# Smart Khata Super Admin Web - Enhanced

Compact Super Admin portal for Smart Khata SaaS.

## Modules included

- Dashboard KPI cards and sales chart
- Business list/search/block/unblock
- Create business + owner/admin user + subscription
- Edit business details
- Business detail drawer
- View every business's users, customers, sales, inventory, billing and performance
- Attach/update subscriptions to any business
- Near-expiry subscription businesses
- WhatsApp API link/key settings per business
- Create super users
- Block/unblock users
- Subscription payment approval/rejection
- Subscription billing history per business
- Inventory export as Excel-compatible CSV
- Small font, compact design

## API URL

Default API:

```text
https://smart-khata-production.up.railway.app
```

## GitHub Pages

Repo name expected:

```text
smart-khata-superadmin-web
```

GitHub Pages URL:

```text
https://wabwar786.github.io/smart-khata-superadmin-web/
```

Run workflow:

```text
Actions -> Deploy Super Admin Portal -> Run workflow
```

Make sure `Settings -> Pages -> Source = GitHub Actions`.

## Important

Deploy the updated API package first, then deploy this web portal. Some admin screens need the new `/api/admin/*` endpoints.


## GitHub Actions npm fix

This version pins React/Vite package versions and uses Node 22. The workflow removes any old `package-lock.json` and installs dependencies with:

```bash
npm install --no-package-lock --no-audit --no-fund --legacy-peer-deps
```

This avoids npm internal lock/cache errors on GitHub Actions.
