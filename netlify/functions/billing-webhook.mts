import type { Config } from '@netlify/functions';
import { createHmac, timingSafeEqual } from 'node:crypto';

function verifySignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(',').map(part => part.split('=')));
  if (!parts.t || !parts.v1) return false;
  const expected = createHmac('sha256', secret).update(`${parts.t}.${payload}`, 'utf8').digest('hex');
  try { return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1)); } catch { return false; }
}

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: 'Webhook secret is not configured.' }, { status: 503 });
  const signature = request.headers.get('stripe-signature');
  const payload = await request.text();
  if (!signature || !verifySignature(payload, signature, secret)) return Response.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  const event = JSON.parse(payload) as { type: string; id: string; data?: { object?: Record<string, unknown> } };
  const supported = new Set(['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_failed']);
  if (!supported.has(event.type)) return Response.json({ received: true, ignored: true });
  console.log(JSON.stringify({ source: 'stripe', eventId: event.id, type: event.type, objectId: event.data?.object?.id ?? null, status: event.data?.object?.status ?? null, customer: event.data?.object?.customer ?? null }));
  return Response.json({ received: true });
};

export const config: Config = { path: '/api/billing/webhook' };