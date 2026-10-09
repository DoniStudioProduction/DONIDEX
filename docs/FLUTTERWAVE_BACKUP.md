# DONIDEX Flutterwave Backup Provider

Paystack remains the primary provider. Flutterwave is a user-selected backup checkout path; the app must never automatically submit a second charge after a Paystack attempt because the first transaction may still settle asynchronously.

## Netlify environment variables

Add these as **site-level server environment variables** for DONIDEX (never commit secrets):

- `FLW_SECRET_KEY` — Flutterwave secret key (server-side only)
- `FLW_WEBHOOK_SECRET_HASH` — exact webhook secret hash configured in Flutterwave dashboard
- `FLW_PREMIUM_MONTHLY_PLAN_ID`
- `FLW_PREMIUM_YEARLY_PLAN_ID`
- `FLW_BUSINESS_MONTHLY_PLAN_ID`
- `FLW_BUSINESS_YEARLY_PLAN_ID`

Create the four Flutterwave payment plans in NGN using the locked amounts: ₦5,000 monthly, ₦50,000 yearly, ₦15,000 monthly, ₦150,000 yearly. The corresponding interval must be monthly/yearly. Use test credentials and test plan IDs first; production plan IDs must be supplied separately.

## Endpoints

- `GET /api/billing/flutterwave-catalog`
- `POST /api/billing/flutterwave-checkout`
- `GET /api/billing/flutterwave-verify?transaction_id=...`
- `GET /api/billing/flutterwave-status?email=...`
- `POST /api/billing/flutterwave-webhook`

Checkout and status/verification endpoints require a verified Firebase identity. The secret key stays server-side. The webhook endpoint validates Flutterwave's `verif-hash` header. Payment verification must validate transaction status, amount, currency, transaction reference, and signed-in customer before any paid entitlement is granted.

## Rollout guardrails

1. Keep Paystack primary; expose Flutterwave only when its secret and all four plan IDs are configured.
2. Do not switch providers silently or auto-retry a Paystack charge through Flutterwave.
3. Never grant paid access based only on a browser redirect or unverified webhook payload.
4. Test in Flutterwave test mode before configuring live credentials.
5. Do not merge to `main` or deploy to production until provider entitlement synchronization and test-mode checkout/verification are reviewed.
