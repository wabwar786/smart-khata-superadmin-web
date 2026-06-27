# Super Admin Modules

## Dashboard

Shows:

- Total businesses
- Total users
- Pending subscription payments
- Active subscriptions
- Platform overview chart

API:

```text
GET /api/admin/dashboard
```

## Businesses

Shows all registered businesses and owner details.

Features:

- Search business/owner/phone
- Block business
- Unblock business

APIs:

```text
GET /api/admin/businesses
PATCH /api/admin/businesses/:publicId/block
```

## Subscription Payments

Shows manual payment requests submitted by business users.

Features:

- Filter pending/approved/rejected
- View payment proof URL
- Approve payment
- Reject payment

APIs:

```text
GET /api/admin/subscription-payments
POST /api/admin/subscription-payments/:id/approve
POST /api/admin/subscription-payments/:id/reject
```

## Plans

Shows active subscription plans.

API:

```text
GET /api/subscriptions/plans
```
