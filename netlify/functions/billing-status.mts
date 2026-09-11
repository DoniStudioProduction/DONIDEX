import type { Config } from '@netlify/functions';

const pricePlan = new Map([
  [process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID, 'Premium'],
  [process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_1UDyvUBobbaEE4WQpXOMxZx3', 'Premium'],
  [process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID, 'Business / Team'],
  [process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID, 'Business / Team'],
].filter(([id]) => Boolean(id)) as [string, string][]);

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  const secret = process.env.STRIPE_API_KEY;
  if (!secret) return Response.json({ error: 'Billing is not configured on this deployment.' }, { status: 503 });
  const email = new URL(request.url).searchParams.get('email');
  if (!email) return Response.json({ error: 'Email is required.' }, { status: 400 });
  const headers = { Authorization: `Bearer ${secret}` };
  const customerResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=10`, { headers });
  const customerData = await customerResponse.json();
  if (!customerResponse.ok) return Response.json({ error: customerData?.error?.message || 'Could not read billing customer.' }, { status: 502 });
  for (const customer of customerData.data || []) {
    const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${encodeURIComponent(customer.id)}&status=all&limit=20`, { headers });
    const subscriptionData = await subscriptionResponse.json();
    if (!subscriptionResponse.ok) continue;
    const subscriptions = (subscriptionData.data || []).filter((s: any) => ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status));
    const preferred = subscriptions.find((s: any) => ['active', 'trialing'].includes(s.status)) || subscriptions[0];
    if (!preferred) continue;
    const item = preferred.items?.data?.[0];
    const priceId = item?.price?.id;
    return Response.json({ plan: pricePlan.get(priceId) || 'Paid', status: preferred.status, subscriptionId: preferred.id, customerId: customer.id, priceId, entitlementActive: ['active', 'trialing'].includes(preferred.status) });
  }
  return Response.json({ plan: 'Free', status: 'none', entitlementActive: false });
};

export const config: Config = { path: '/api/billing/status' };