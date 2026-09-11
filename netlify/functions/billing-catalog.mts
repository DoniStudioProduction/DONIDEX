import type { Config } from '@netlify/functions';

const prices = [
  { key: 'premium_monthly', name: 'DONIDEX Premium', interval: 'month', amount: 5000, priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '' },
  { key: 'premium_yearly', name: 'DONIDEX Premium', interval: 'year', amount: 50000, priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_1UDyvUBobbaEE4WQpXOMxZx3' },
  { key: 'business_monthly', name: 'DONIDEX Business / Team', interval: 'month', amount: 15000, priceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || '' },
  { key: 'business_yearly', name: 'DONIDEX Business / Team', interval: 'year', amount: 150000, priceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '' },
];

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  return Response.json({ currency: 'ngn', prices, configured: Boolean(process.env.STRIPE_API_KEY) });
};

export const config: Config = { path: '/api/billing/catalog' };