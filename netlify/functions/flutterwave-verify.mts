import type { Config } from '@netlify/functions';
import { isIdentityResponse, requireFirebaseIdentity } from './_auth.mts';

const plans = new Map([
  [String(process.env.FLW_PREMIUM_MONTHLY_PLAN_ID || ''), { name: 'Premium', amount: 5000 }],
  [String(process.env.FLW_PREMIUM_YEARLY_PLAN_ID || ''), { name: 'Premium', amount: 50000 }],
  [String(process.env.FLW_BUSINESS_MONTHLY_PLAN_ID || ''), { name: 'Business / Team', amount: 15000 }],
  [String(process.env.FLW_BUSINESS_YEARLY_PLAN_ID || ''), { name: 'Business / Team', amount: 150000 }],
].filter(([id]) => Boolean(id)) as [string, { name: string; amount: number }][]);

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  const identity = await requireFirebaseIdentity(request);
  if (isIdentityResponse(identity)) return identity;
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return Response.json({ error: 'Flutterwave backup billing is not configured.' }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const transactionId = params.get('transaction_id')?.trim() || '';
  if (!/^\d{1,20}$/.test(transactionId)) return Response.json({ error: 'A valid Flutterwave transaction ID is required.' }, { status: 400 });
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.status !== 'success' || !result?.data) return Response.json({ error: result?.message || 'Could not verify the Flutterwave transaction.' }, { status: 502 });
  const tx = result.data as Record<string, any>;
  const meta = (tx.meta && typeof tx.meta === 'object' ? tx.meta : {}) as Record<string, any>;
  const txRef = String(tx.tx_ref || '');
  const plan = plans.get(String(meta.planId || tx.payment_plan || ''));
  const expectedAmount = Number(meta.expectedAmount || plan?.amount || 0);
  const ownerMatches = txRef.startsWith(`dx-${identity.uid}-`) && String(meta.userId || '') === identity.uid && String(tx.customer?.email || '').toLowerCase() === identity.email;
  const amountMatches = Number(tx.amount) >= expectedAmount && String(tx.currency || '').toUpperCase() === 'NGN';
  const verified = String(tx.status || '').toLowerCase() === 'successful' && ownerMatches && amountMatches && expectedAmount > 0;
  return Response.json({
    verified,
    provider: 'flutterwave',
    reference: txRef || null,
    status: String(tx.status || 'unknown').toLowerCase(),
    amount: Number(tx.amount || 0),
    currency: tx.currency || 'NGN',
    customerEmail: tx.customer?.email || null,
    plan: plan?.name || null,
    paidAt: tx.created_at || null,
  });
};

export const config: Config = { path: '/api/billing/flutterwave-verify' };
