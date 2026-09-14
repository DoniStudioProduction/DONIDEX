import type { Config } from '@netlify/functions';

const subscriptionPattern = /^SUB_[A-Za-z0-9_-]{6,120}$/;

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return Response.json({ error: 'Paystack billing is not configured on this deployment.' }, { status: 503 });
  const body = await request.json().catch(() => null) as { subscriptionCode?: string } | null;
  const subscriptionCode = String(body?.subscriptionCode || '').trim();
  if (!subscriptionPattern.test(subscriptionCode)) return Response.json({ error: 'A valid Paystack subscription code is required.' }, { status: 400 });
  const response = await fetch(`https://api.paystack.co/subscription/${encodeURIComponent(subscriptionCode)}/manage/link`, { headers: { Authorization: `Bearer ${secret}` } });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status || !data?.data?.link) return Response.json({ error: data?.message || 'Paystack subscription management link could not be created.' }, { status: 502 });
  return Response.json({ url: data.data.link });
};

export const config: Config = { path: '/api/billing/portal' };