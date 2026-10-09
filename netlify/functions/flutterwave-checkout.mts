import type { Config } from '@netlify/functions';
import { randomUUID } from 'node:crypto';
import { isIdentityResponse, requireFirebaseIdentity } from './_auth.mts';

const plans = new Map([
  [process.env.FLW_PREMIUM_MONTHLY_PLAN_ID, { key: 'premium_monthly', amount: 5000 }],
  [process.env.FLW_PREMIUM_YEARLY_PLAN_ID, { key: 'premium_yearly', amount: 50000 }],
  [process.env.FLW_BUSINESS_MONTHLY_PLAN_ID, { key: 'business_monthly', amount: 15000 }],
  [process.env.FLW_BUSINESS_YEARLY_PLAN_ID, { key: 'business_yearly', amount: 150000 }],
].filter(([id]) => Boolean(id)) as [string, { key: string; amount: number }][]);

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  const identity = await requireFirebaseIdentity(request);
  if (isIdentityResponse(identity)) return identity;
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return Response.json({ error: 'Flutterwave backup billing is not configured.' }, { status: 503 });
  const body = await request.json().catch(() => null) as { priceId?: string; customerEmail?: string; userId?: string } | null;
  const plan = body?.priceId ? plans.get(body.priceId) : undefined;
  if (!body?.priceId || !plan) return Response.json({ error: 'Unknown or unconfigured Flutterwave plan.' }, { status: 400 });
  if (body.customerEmail && String(body.customerEmail).trim().toLowerCase() !== identity.email) return Response.json({ error: 'Customer email does not match the signed-in user.' }, { status: 403 });
  if (body.userId && String(body.userId) !== identity.uid) return Response.json({ error: 'Customer account does not match the signed-in user.' }, { status: 403 });
  const txRef = `dx-${identity.uid}-${randomUUID()}`;
  const origin = new URL(request.url).origin;
  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: plan.amount,
      currency: 'NGN',
      redirect_url: `${origin}/?billing=flutterwave-return`,
      payment_plan: Number(body.priceId),
      customer: { email: identity.email },
      meta: { userId: identity.uid, email: identity.email, planKey: plan.key, expectedAmount: plan.amount, provider: 'flutterwave' },
      customizations: { title: 'DONIDEX', description: 'DONIDEX subscription' },
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.status !== 'success' || !data?.data?.link) return Response.json({ error: data?.message || 'Flutterwave checkout could not be created.' }, { status: 502 });
  return Response.json({ url: data.data.link, reference: txRef, provider: 'flutterwave' });
};

export const config: Config = { path: '/api/billing/flutterwave-checkout' };
