import type { Config } from '@netlify/functions';

const prices = [
  { key: 'premium_monthly', name: 'DONIDEX Premium', interval: 'month', amount: 5000, priceId: process.env.PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE || '' },
  { key: 'premium_yearly', name: 'DONIDEX Premium', interval: 'year', amount: 50000, priceId: process.env.PAYSTACK_PREMIUM_YEARLY_PLAN_CODE || '' },
  { key: 'business_monthly', name: 'DONIDEX Business / Team', interval: 'month', amount: 15000, priceId: process.env.PAYSTACK_BUSINESS_MONTHLY_PLAN_CODE || '' },
  { key: 'business_yearly', name: 'DONIDEX Business / Team', interval: 'year', amount: 150000, priceId: process.env.PAYSTACK_BUSINESS_YEARLY_PLAN_CODE || '' },
];

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  return Response.json({ currency: 'NGN', provider: 'paystack', prices, configured: Boolean(process.env.PAYSTACK_SECRET_KEY && prices.every(p => p.priceId)) });
};

export const config: Config = { path: '/api/billing/catalog' };