import type { Config } from '@netlify/functions';

const plans = new Set([
  process.env.PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE,
  process.env.PAYSTACK_PREMIUM_YEARLY_PLAN_CODE,
  process.env.PAYSTACK_BUSINESS_MONTHLY_PLAN_CODE,
  process.env.PAYSTACK_BUSINESS_YEARLY_PLAN_CODE,
].filter(Boolean));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uidPattern = /^[A-Za-z0-9_-]{10,150}$/;

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return Response.json({ error: 'Paystack billing is not configured on this deployment.' }, { status: 503 });
  const body = await request.json().catch(() => null) as { priceId?: string; customerEmail?: string; userId?: string } | null;
  const customerEmail = String(body?.customerEmail || '').trim().toLowerCase();
  if (!body?.priceId || !plans.has(body.priceId)) return Response.json({ error: 'Unknown or unconfigured Paystack plan.' }, { status: 400 });
  if (!emailPattern.test(customerEmail) || customerEmail.length > 254) return Response.json({ error: 'A valid customer email is required.' }, { status: 400 });
  if (body.userId && !uidPattern.test(body.userId)) return Response.json({ error: 'Invalid customer account identifier.' }, { status: 400 });
  const origin = new URL(request.url).origin;
  const payload = {
    email: customerEmail,
    plan: body.priceId,
    callback_url: `${origin}/?billing=paystack-return`,
    metadata: JSON.stringify({ userId: body.userId || null, email: customerEmail, planCode: body.priceId }),
  };
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status || !data?.data?.authorization_url) return Response.json({ error: data?.message || 'Paystack checkout could not be created.' }, { status: 502 });
  return Response.json({ url: data.data.authorization_url, reference: data.data.reference, accessCode: data.data.access_code });
};

export const config: Config = { path: '/api/billing/checkout' };