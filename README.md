# DONIDEX

Mobile-first business management platform for invoices, customers, expenses, payments, reports, multi-business operations, and business growth.

## Migration status

GitHub is the source of truth for the DONIDEX migration to a zero-upfront-cost hosting path.

### Built and verified
- [x] GitHub repository and React/Vite foundation
- [x] Core workspace: dashboard, invoices, customers, expenses and reports
- [x] Mobile-first responsive/card-overlap hardening
- [x] Clickable DONIDEX logo menu
- [x] User Profile and Business Settings entry points
- [x] Locked pricing preserved
- [x] Google, Apple and Email authentication foundation
- [x] Username registration label
- [x] Show/hide password control
- [x] Email verification gate
- [x] Firebase auth/data foundation
- [x] User directory indexing for verified accounts
- [x] Owner Top-Up subscription recovery console
- [x] Owner-verified entitlement recovery for customers whose Paystack activation is delayed
- [x] Multi-business switching foundation
- [x] Backup/recovery hardening foundation
- [x] Payment Center with full/partial payment recording and receipts
- [x] Business Hub: products/services, recurring profiles, payment follow-up and insights
- [x] Business Hub data included in authenticated per-business cloud sync
- [x] Capacitor Android packaging
- [x] Android API 36 enforcement and successful release workflow
- [x] GitHub Actions → Netlify production deployment workflow
- [x] Netlify project configured
- [x] Paystack plan-code configuration in Netlify

### Remaining release work
- [ ] Verify the latest Netlify production deployment end-to-end
- [ ] Add/recover Paystack Live Secret Key in Netlify without exposing it in chat
- [ ] Finish full document editor parity: quotation conversion, receipt creation, preview/edit/duplicate, print/PDF and WhatsApp sharing
- [ ] Harden authenticated cloud sync across every migrated module
- [ ] Complete secure invoice sharing and payment reminder automation
- [ ] Production Android signing and signed AAB
- [ ] Google Play Console registration and release submission when the developer account payment step is funded

## Locked commercial plan
- Free — NGN 0
- Premium — NGN 5,000/month or NGN 50,000/year
- Business / Team — NGN 15,000/month or NGN 150,000/year

## Owner subscription recovery
- Owner/admin identity: `donistudioproduction@gmail.com`
- Search verified DONIDEX accounts by email and linked provider metadata.
- Manually grant Premium or Business / Team access for a selected duration after independently verifying payment proof.
- Manual entitlements are recorded against the customer's Firebase UID with reason, payment/receipt reference, creator identity and timestamps.
- Active owner recovery entitlements are honored by the billing UI even when Paystack activation is delayed.
- Firestore rules restrict owner recovery writes to the verified owner identity and customer reads to the customer or owner.

## Locked authentication
- Google
- Apple
- Email
- Email verification required before private workspace access
- Username registration label
- Show/hide password
- No X login

## Paystack
The four locked paid plans use the Paystack plan codes configured in the Netlify production environment. The Paystack secret key remains server-side only.

## Support
- donidexsupport@gmail.com

## Development
The application is mobile-first and designed for Netlify deployment. Firebase is used for authentication and persistence. Environment configuration and secrets are never committed to the repository.
