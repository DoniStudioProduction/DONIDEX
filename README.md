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
- [x] Capacitor Android packaging
- [x] Android API 36 enforcement and release workflow
- [x] GitHub Actions build verification
- [x] GitHub Actions → Netlify production deployment workflow
- [x] Netlify project configured
- [x] Paystack plan-code configuration in Netlify

### Remaining release/external work
- [ ] Verify the next Netlify production deployment end-to-end after production deploy credits resume
- [ ] Add/recover Paystack Live Secret Key in Netlify without exposing it in chat
- [ ] Complete secure public invoice-share endpoint and tokenized access
- [ ] Complete server-side Team/Staff invitation acceptance and role enforcement
- [ ] Production Android signing and signed AAB
- [ ] Google Play Console registration and release submission when the developer account payment step is funded

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
The four locked paid plans use the Paystack plan codes configured in the Netlify production environment. The Paystack secret key remains server-side only.

## Support
- donidexsupport@gmail.com

## Development
The application is mobile-first and designed for Netlify deployment. Firebase is used for authentication and persistence. Environment configuration and secrets are never committed to the repository.
