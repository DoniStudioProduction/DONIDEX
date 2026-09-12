# DONIDEX Paystack Worker

DONIDEX now supports a secure Paystack backend outside Netlify so the Paystack secret never needs to be stored as a Netlify environment secret.

## Free deployment path

The payment backend lives in `cloudflare/paystack-worker` and deploys to Cloudflare Workers. The Workers Free plan currently includes 100,000 requests/day. Cloudflare Workers secrets are encrypted and are not exposed in the dashboard after creation.

## GitHub Actions secrets

Add these repository Actions secrets before running **Deploy secure Paystack Worker**:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with permission to deploy Workers.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID that owns the Worker.
- `PAYSTACK_SECRET_KEY` — the Paystack Live Secret Key.

Never commit the Paystack key to the repository and never place it in frontend code.

## Deploy

1. Create or use a free Cloudflare account.
2. Enable the account's `workers.dev` subdomain if it is not already enabled.
3. Add the three GitHub Actions secrets above.
4. Open GitHub Actions for DONIDEX.
5. Run **Deploy secure Paystack Worker** manually.
6. Copy the resulting Worker URL, which will use the account's `workers.dev` domain.
7. Add the Worker URL to DONIDEX as the non-secret Netlify build variable `VITE_PAYSTACK_API_BASE` when Netlify production deployments are available again.

The Worker provides `/catalog`, `/checkout`, `/status`, `/portal`, and `/webhook` endpoints.

The locked DONIDEX plans remain:

- Free — ₦0
- Premium — ₦5,000/month
- Premium — ₦50,000/year
- Business / Team — ₦15,000/month
- Business / Team — ₦150,000/year
