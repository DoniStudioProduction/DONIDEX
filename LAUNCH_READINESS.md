# DONIDEX Launch Readiness — Tasks 21–23

## Task 21 — Production App Test Suite

The release smoke suite covers authentication, profile/workspace persistence, billing and entitlements, Paystack, team roles, secure sharing, mobile UX, PWA installation, and app sharing.

CI verifies every push with both the web production build and Android bundle build.

## Task 22 — Security and Regression Controls

Production security headers are enforced through `netlify.toml`. Billing endpoints require authenticated Firebase ID tokens, Originator recovery endpoints are owner-restricted, and production secrets remain server-side.

Real-world authentication and payment transactions must still be tested after production deployment; CI cannot prove provider-side configuration or a successful live charge.

## Task 23 — Launch Preparation

The GitHub repository is the source of truth. The existing Netlify site remains the production target. Production deployment must wait until Netlify production credits resume.

Before launch, verify:

1. Firebase runtime API key is configured for Netlify Functions.
2. Paystack live secret and four locked plan codes are configured.
3. Google/Apple providers are configured for the production Firebase project.
4. Controlled live Paystack checkout and callback/webhook tests pass.
5. Production authentication smoke tests pass.
6. PWA install/share tests pass on mobile.
7. Official Google Play listing URL is inserted only after the listing exists.

No Play Store URL or package identifier is invented in source code.
