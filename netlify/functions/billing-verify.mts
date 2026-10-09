import type { Config } from '@netlify/functions';
import { isIdentityResponse, requireFirebaseIdentity } from './_auth.mts';
import { PAYSTACK_PLAN_NAMES } from './_paystack-plans.mts';

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  const identity = await requireFirebaseIdentity(request);
  if (isIdentityResponse(identity)) return identity;

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return Response.json({ error: 'Paystack billing is not configured on this deployment.' }, { status: 503 });
  const reference = new URL(request.url).searchParams.get('reference')?.trim();
  if (!reference || !/^[A-Za-z0-9._-]{3,100}$/.test(reference)) return Response.json({ error: 'A valid Paystack reference is required.' }, { status: 400 });

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status || !data?.data) return Response.json({ error: data?.message || 'Could not verify the Paystack transaction.' }, { status: 502 });

  const transaction = data.data as Record<string, any>;
  let metadata: Record<string, any> = {};
  if (transaction.metadata && typeof transaction.metadata === 'object') metadata = transaction.metadata;
  else if (typeof transaction.metadata === 'string') {
    try { metadata = JSON.parse(transaction.metadata); } catch { metadata = {}; }
  }
  const transactionEmail = String(transaction.customer?.email || metadata.email || '').trim().toLowerCase();
  if (transactionEmail !== identity.email || (metadata.userId && String(metadata.userId) !== identity.uid)) {
    return Response.json({ error: 'This transaction does not belong to the signed-in account.' }, { status: 403 });
  }

  const planCode = String(transaction.plan?.plan_code || transaction.plan?.code || metadata.planCode || '');
  const status = String(transaction.status || 'unknown').toLowerCase();
  return Response.json({
    verified: status === 'success',
    reference: transaction.reference || reference,
    status,
    amount: Number(transaction.amount || 0),
    currency: transaction.currency || 'NGN',
    customerEmail: transactionEmail,
    plan: PAYSTACK_PLAN_NAMES.get(planCode) || transaction.plan?.name || null,
    planCode: planCode || null,
    subscriptionCode: transaction.subscription?.subscription_code || transaction.subscription_code || null,
    paidAt: transaction.paid_at || null,
  });
};

export const config: Config = { path: '/api/billing/verify' };
