# DONIDEX

Mobile-first business management platform for invoices, customers, expenses, payments, reports, multi-business operations, and business growth.

## Migration

This repository is the new source of truth for the DONIDEX migration away from AppDeploy. The existing AppDeploy deployment remains untouched as the reference build while the frontend, serverless API, authentication, persistence, email, and Stripe integrations are reconstructed for a zero-upfront-cost hosting path.

### Migration status
- [x] GitHub repository established
- [x] React/Vite foundation established
- [x] Core DONIDEX workspace reconstructed
- [x] Mobile/card-overlap responsive hardening added
- [x] User Profile and Business Settings entry points preserved
- [x] Locked pricing preserved
- [x] Firebase authentication/data foundation added
- [ ] Full document editor and print/PDF workflow
- [ ] Business Hub modules
- [ ] Multi-business persistence and switching
- [ ] Backup/recovery integrity workflow
- [ ] Netlify Functions/serverless API
- [ ] Email verification delivery configuration
- [ ] Stripe checkout/webhook migration and live verification
- [ ] Netlify deployment and production QA

### Locked commercial plan
- Free — NGN 0
- Premium — NGN 5,000/month or NGN 50,000/year
- Business / Team — NGN 15,000/month or NGN 150,000/year

### Locked authentication
- Google
- Apple
- Email
- Email verification required before private workspace access
- Username registration label
- Show/hide password
- No X login

### Support
- donidexsupport@gmail.com

## Development

The application is mobile-first and designed for Netlify deployment. Firebase is used as the provider-neutral authentication and persistence foundation; configuration is supplied through environment variables and never committed to the repository. Secrets must never be committed to this repository.
