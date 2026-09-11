import type { Config } from '@netlify/functions';
import { createHmac, timingSafeEqual } from 'node:crypto';

function verifySignature(payload: string, header: string, secret: string) {
  const expected = createHmac('sha512', secret).update(payload, 'utf8').digest('hex');
  try { return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(header, 'utf8')); } catch { return false; }
}

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return Response.json({ error: 'Paystack webhook secret is not configured.' }, { status: 503 });
  const signature = request.headers.get('x-paystack-signature');
  const payload = await request.text();
  if (!signature || !verifySignature(payload, signature, secret)) return Response.json({ error: 'Invalid Paystack webhook signature.' }, { status: 400 });
  let event: { event?: string; data?: Record<string, unknown> };
  try { event = JSON.parse(payload); } catch { return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 }); }
  const supported = new Set(['charge.success', 'subscription.create', 'subscription.disable', 'subscription.not_renew', 'invoice.payment_failed', 'invoice.update']);
  if (!supported.has(event.event || '')) return Response.json({ received: true, ignored: true });
  const data = event.data || {};
  console.log(JSON.stringify({ source: 'paystack', event: event.event, reference: data.reference ?? null, subscription: data.subscription_code ?? null, status: data.status ?? null, customer: typeof data.customer === 'object' && data.customer ? (data.customer as Record<string, unknown>).email ?? null : data.customer ?? null }));
  return Response.json({ received: true });
};

export const config: Config = { path: '/api/billing/webhook' };