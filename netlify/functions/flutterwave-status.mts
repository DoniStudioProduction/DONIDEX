import type { Config } from '@netlify/functions';
import { isIdentityResponse, requireFirebaseIdentity } from './_auth.mts';

const planNames = new Map([
  [String(process.env.FLW_PREMIUM_MONTHLY_PLAN_ID || ''), { name: 'Premium', interval: 'month', amount: 5000 }],
  [String(process.env.FLW_PREMIUM_YEARLY_PLAN_ID || ''), { name: 'Premium', interval: 'year', amount: 50000 }],
  [String(process.env.FLW_BUSINESS_MONTHLY_PLAN_ID || ''), { name: 'Business / Team', interval: 'month', amount: 15000 }],
  [String(process.env.FLW_BUSINESS_YEARLY_PLAN_ID || ''), { name: 'Business / Team', interval: 'year', amount: 150000 }],
].filter(([id]) => Boolean(id)) as [string, { name: string; interval: string; amount: number }][]);

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  const identity = await requireFirebaseIdentity(request);
  if (isIdentityResponse(identity)) return identity;
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return Response.json({ error: 'Flutterwave backup billing is not configured.' }, { status: 503 });
  const requestedEmail = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() || identity.email;
  if (requestedEmail !== identity.email) return Response.json({ error: 'Billing account does not match the signed-in user.' }, { status: 403 });
  const response = await fetch(`https://api.flutterwave.com/v3/subscriptions?email=${encodeURIComponent(identity.email)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.status !== 'success') return Response.json({ error: result?.message || 'Could not read Flutterwave subscription status.' }, { status: 502 });
  const subscriptions = Array.isArray(result.data) ? result.data : [];
  const history = subscriptions.map((s: any) => {
    const planId = String(s.plan?.id || s.plan_id || s.payment_plan || '');
    const plan = planNames.get(planId);
    return { id: String(s.id || s.subscription_id || planId), plan: plan?.name || s.plan?.name || 'Paid', status: String(s.status || 'unknown').toLowerCase(), interval: plan?.interval || s.plan?.interval || null, amount: Number(s.amount || plan?.amount || s.plan?.amount || 0), currency: s.currency || 'NGN', start: s.created_at || s.subscribed_on || null, nextPayment: s.next_due || s.next_payment_date || null };
  }).sort((a: any, b: any) => String(b.start || '').localeCompare(String(a.start || '')));
  const preferred = history.find((s: any) => ['active', 'non-renewing'].includes(s.status)) || history[0];
  if (!preferred) return Response.json({ plan: 'Free', status: 'none', entitlementActive: false, provider: 'flutterwave', history: [] });
  return Response.json({ ...preferred, entitlementActive: ['active', 'non-renewing'].includes(preferred.status), subscriptionId: preferred.id, provider: 'flutterwave', history });
};

export const config: Config = { path: '/api/billing/flutterwave-status' };
