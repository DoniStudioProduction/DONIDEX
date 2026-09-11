import type { Config } from '@netlify/functions';

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  const secret = process.env.STRIPE_API_KEY;
  if (!secret) return Response.json({ error: 'Billing is not configured on this deployment.' }, { status: 503 });
  const body = await request.json().catch(() => null) as { customerId?: string } | null;
  if (!body?.customerId) return Response.json({ error: 'A Stripe customer ID is required.' }, { status: 400 });
  const params = new URLSearchParams({ customer: body.customerId, return_url: new URL('/?billing=portal-return', request.url).toString() });
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
  const data = await response.json();
  if (!response.ok) return Response.json({ error: data?.error?.message || 'Stripe billing portal could not be created.' }, { status: 502 });
  return Response.json({ url: data.url });
};

export const config: Config = { path: '/api/billing/portal' };