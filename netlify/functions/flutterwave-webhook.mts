import type { Config } from '@netlify/functions';
import { timingSafeEqual } from 'node:crypto';

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  const secretHash = process.env.FLW_WEBHOOK_SECRET_HASH;
  if (!secretHash) return Response.json({ error: 'Flutterwave webhook secret hash is not configured.' }, { status: 503 });
  const signature = request.headers.get('verif-hash') || '';
  if (!signature || !safeEqual(signature, secretHash)) return Response.json({ error: 'Invalid Flutterwave webhook signature.' }, { status: 400 });
  const payload = await request.json().catch(() => null) as { event?: string; data?: Record<string, any> } | null;
  if (!payload) return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  const event = String(payload.event || '');
  const data = payload.data || {};
  console.log(JSON.stringify({ source: 'flutterwave', event, transactionId: data.id ?? null, reference: data.tx_ref ?? null, status: data.status ?? null, customer: data.customer?.email ?? null }));
  return Response.json({ received: true });
};

export const config: Config = { path: '/api/billing/flutterwave-webhook' };
