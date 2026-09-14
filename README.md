# DONIDEX

Mobile-first business management platform for invoices, customers, expenses, payments, reports, multi-business operations, and business growth.

## Migration status

GitHub is the source of truth for the DONIDEX migration to a zero-upfront-cost hosting path.

### Built and verified in source
- [x] GitHub repository and React/Vite foundation
- [x] Core workspace: dashboard, invoices, customers, expenses and reports
- [x] Mobile-first responsive/card-overlap hardening
- [x] Clickable DONIDEX logo menu
- [x] User Profile and Business Settings entry points
- [x] Locked pricing preserved
- [x] Google, Apple and Email authentication foundation
- [x] Username registration label
- [x] Show/hide password control
- [x] Email verification gate and resend flow
- [x] Password reset flow
- [x] Firebase auth/data foundation
- [x] User directory indexing for verified accounts
- [x] Originator Control Center for verified-user recovery
- [x] Flexible Premium / Business-Team subscription recovery
- [x] Originator wallet credit and controlled debit recovery with audit records
- [x] Active owner recovery entitlement honored by billing, Growth and Team UI
- [x] Multi-business switching foundation
- [x] Backup/recovery hardening foundation
- [x] Payment Center with full/partial payment recording and receipts
- [x] Business Hub: products/services, recurring profiles, payment follow-up and insights
- [x] Business Hub data included in authenticated per-business cloud sync
- [x] Document workflow parity: quotation conversion, receipt creation, preview/edit/duplicate, print/PDF and WhatsApp sharing
- [x] Tokenized shared-document access with owner-controlled publication
- [x] Team invitations, membership persistence and role-aware workspace access
- [x] Capacitor Android packaging
- [x] Android API 36 enforcement and release workflow
- [x] GitHub Actions build verification
- [x] GitHub Actions → Netlify production deployment workflow
- [x] Netlify project configured
- [x] Paystack plan-code configuration in Netlify
- [x] Authenticated billing status, checkout, verification and subscription-management requests
- [x] Privacy-safe local telemetry and production error boundary
- [x] Final CI build-output quality gate

### Remaining release/external work
- [ ] Verify the next Netlify production deployment end-to-end after production deploy credits resume
- [ ] Add/recover Paystack Live Secret Key in Netlify without exposing it in chat
- [ ] Configure `FIREBASE_WEB_API_KEY` (or server-side access to the existing Firebase web API key) in Netlify for authenticated billing API verification
- [ ] Production Android signing and signed AAB
- [ ] Google Play Console registration and release submission when the developer account payment step is funded
- [ ] Live end-to-end authentication, billing, webhook and mobile smoke tests

## Locked commercial plan
- Free — NGN 0
- Premium — NGN 5,000/month or NGN 50,000/year
- Business / Team — NGN 15,000/month or NGN 150,000/year

## Originator Control Center
- Originator/admin identity: `donistudioproduction@gmail.com`
- Search verified DONIDEX accounts by email and linked provider metadata.
- Manually grant Premium or Business / Team access for a selected duration after independently verifying payment proof.
- Manual wallet credits and controlled debits require amount, reason and payment reference and are recorded with creator identity and timestamps.
- Subscription recovery is stored against the customer's Firebase UID and is honored while active even when Paystack activation is delayed.
- Firestore rules restrict Originator recovery writes to the verified Originator identity and customer recovery reads to the affected customer or Originator.

## Locked authentication
- Google
- Apple
- Email
- Email verification required before private workspace access
- Username registration label
- Show/hide password
- Password reset
- No X login

## Paystack
The four locked paid plans use the Paystack plan codes configured in the Netlify production environment. The Paystack secret key remains server-side only. Billing endpoints require a verified Firebase identity and bind billing activity to the authenticated account.

## Task 16 — Final launch-readiness hardening
Task 16 completes the final code-level launch-readiness pass before production deployment. Billing account enumeration was closed by requiring Firebase authentication on billing status, checkout, transaction verification and subscription-management endpoints. Client billing requests now send the Firebase ID token. Subscription-management requests additionally verify the Paystack subscription owner before issuing a management link.

### Required production environment
- Paystack secret and four Paystack plan codes in Netlify server environment.
- `FIREBASE_WEB_API_KEY` in Netlify server environment for Firebase ID-token verification. This is the Firebase web API key, not a private credential.
- Firebase client configuration remains in the existing `VITE_FIREBASE_*` environment variables.
- Never commit Paystack secrets, Firebase private credentials or other private credentials to GitHub or paste them into chat.

## Support
- donidexsupport@gmail.com

## Development
The application is mobile-first and designed for Netlify deployment. Firebase is used for authentication and persistence. Environment configuration and secrets are never committed to the repository.
