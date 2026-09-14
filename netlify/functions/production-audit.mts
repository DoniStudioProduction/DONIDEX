import type { Config } from '@netlify/functions';
import { isIdentityResponse, requireFirebaseIdentity } from './_auth.mts';

const OWNER_EMAIL = 'donistudioproduction@gmail.com';

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  const identity = await requireFirebaseIdentity(request);
  if (isIdentityResponse(identity)) return identity;
  if (identity.email !== OWNER_EMAIL) return Response.json({ error: 'Originator access required.' }, { status: 403 });

  const paystackSecretConfigured = Boolean(process.env.PAYSTACK_SECRET_KEY);
  const firebaseApiKeyConfigured = Boolean(process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY);
  const planCodes = {
    premiumMonthly: Boolean(process.env.PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE),
    premiumYearly: Boolean(process.env.PAYSTACK_PREMIUM_YEARLY_PLAN_CODE),
    businessMonthly: Boolean(process.env.PAYSTACK_BUSINESS_MONTHLY_PLAN_CODE),
    businessYearly: Boolean(process.env.PAYSTACK_BUSINESS_YEARLY_PLAN_CODE),
  };

  let paystackReachable = false;
  let paystackMessage = 'Not tested';
  if (paystackSecretConfigured) {
    try {
      const response = await fetch('https://api.paystack.co/balance', {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      paystackReachable = response.ok;
      paystackMessage = response.ok ? 'Paystack API authenticated successfully.' : `Paystack API returned HTTP ${response.status}.`;
    } catch {
      paystackMessage = 'Paystack API could not be reached from the production function.';
    }
  } else {
    paystackMessage = 'PAYSTACK_SECRET_KEY is missing.';
  }

  const checks = {
    authenticatedOriginator: true,
    firebaseRuntimeKey: firebaseApiKeyConfigured,
    paystackSecret: paystackSecretConfigured,
    paystackApi: paystackReachable,
    planCodes,
    allPlanCodesConfigured: Object.values(planCodes).every(Boolean),
  };

  return Response.json({
    ok: checks.authenticatedOriginator && checks.firebaseRuntimeKey && checks.paystackSecret && checks.paystackApi && checks.allPlanCodesConfigured,
    checkedAt: new Date().toISOString(),
    identity: { uid: identity.uid, email: identity.email },
    checks,
    paystackMessage,
    note: 'This audit checks production configuration and authenticated Paystack connectivity. It does not charge a card or modify a subscription.',
  });
};

export const config: Config = { path: '/api/production-audit' };
