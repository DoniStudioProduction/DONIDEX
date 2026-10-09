import type { Config } from '@netlify/functions';
import { PAYSTACK_PLAN_CODES } from './_paystack-plans.mts';

const prices = [
  { key: 'premium_monthly', name: 'DONIDEX Premium', interval: 'month', amount: 5000, priceId: PAYSTACK_PLAN_CODES.premiumMonthly },
  { key: 'premium_yearly', name: 'DONIDEX Premium', interval: 'year', amount: 50000, priceId: PAYSTACK_PLAN_CODES.premiumYearly },
  { key: 'business_monthly', name: 'DONIDEX Business / Team', interval: 'month', amount: 15000, priceId: PAYSTACK_PLAN_CODES.businessMonthly },
  { key: 'business_yearly', name: 'DONIDEX Business / Team', interval: 'year', amount: 150000, priceId: PAYSTACK_PLAN_CODES.businessYearly },
];

export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  return Response.json({ currency: 'NGN', provider: 'paystack', prices, configured: Boolean(process.env.PAYSTACK_SECRET_KEY && prices.every(p => p.priceId)) });
};

export const config: Config = { path: '/api/billing/catalog' };
