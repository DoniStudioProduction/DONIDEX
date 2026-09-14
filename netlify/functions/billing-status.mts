import type { Config } from '@netlify/functions';

const planNames = new Map([
  [process.env.PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE, 'Premium'],
  [process.env.PAYSTACK_PREMIUM_YEARLY_PLAN_CODE, 'Premium'],
  [process.env.PAYSTACK_BUSINESS_MONTHLY_PLAN_CODE, 'Business / Team'],
  [process.env.PAYSTACK_BUSINESS_YEARLY_PLAN_CODE, 'Business / Team'],
].filter(([id]) => Boolean(id)) as [string, string][]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return Response.json({ error: 'Paystack billing is not configured on this deployment.' }, { status: 503 });
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() || '';
  if (!emailPattern.test(email) || email.length > 254) return Response.json({ error: 'A valid account email is required.' }, { status: 400 });
  const response = await fetch(`https://api.paystack.co/customer/${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${secret}` } });
  const data = await response.json().catch(() => null);
  if (response.status === 404) return Response.json({ plan: 'Free', status: 'none', entitlementActive: false, history: [] });
  if (!response.ok || !data?.status) return Response.json({ error: data?.message || 'Could not read Paystack customer billing.' }, { status: 502 });
  const subscriptions = Array.isArray(data.data?.subscriptions) ? data.data.subscriptions : [];
  const history = subscriptions.map((s: any) => {
    const planCode = s.plan?.plan_code || s.plan?.code || s.plan?.id || '';
    return {
      id: s.subscription_code || s.id || planCode,
      plan: planNames.get(String(planCode)) || s.plan?.name || 'Paid',
      status: String(s.status || 'unknown').toLowerCase(),
      interval: s.plan?.interval || null,
      amount: Number(s.amount || s.plan?.amount || 0),
      currency: s.currency || 'NGN',
      start: s.start || s.createdAt || null,
      nextPayment: s.next_payment_date || null,
    };
  }).sort((a: any, b: any) => String(b.start || '').localeCompare(String(a.start || '')));
  const preferred = subscriptions.find((s: any) => ['active', 'non-renewing', 'attention'].includes(String(s.status).toLowerCase())) || subscriptions[0];
  if (!preferred) return Response.json({ plan: 'Free', status: 'none', entitlementActive: false, customerId: data.data?.customer_code || null, history });
  const planCode = preferred.plan?.plan_code || preferred.plan?.code || preferred.plan?.id || '';
  const status = String(preferred.status || 'unknown').toLowerCase();
  return Response.json({ plan: planNames.get(String(planCode)) || 'Paid', status, subscriptionId: preferred.subscription_code || preferred.id || null, customerId: data.data?.customer_code || null, planCode: String(planCode), entitlementActive: ['active', 'non-renewing'].includes(status), history });
};

export const config: Config = { path: '/api/billing/status' };
