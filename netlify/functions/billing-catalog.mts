import type { Config } from '@netlify/functions';

const catalog = {
  currency: 'NGN',
  plans: [
    { id: 'free', name: 'FREE', monthly: 0, yearly: 0, features: ['Core invoicing', 'Customers', 'Expenses', 'Basic reports'] },
    { id: 'premium', name: 'DONIDEX Premium', monthly: 5000, yearly: 50000, monthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? null, yearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID ?? null, features: ['Advanced reports', 'Automation', 'Growth insights', 'Premium workflows'] },
    { id: 'business', name: 'DONIDEX Business / Team', monthly: 15000, yearly: 150000, monthlyPriceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? null, yearlyPriceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID ?? null, features: ['Team functionality', 'Multi-business operations', 'Advanced growth features', 'Priority workflows'] }
  ]
};

export default async () => Response.json(catalog, { headers: { 'cache-control': 'public, max-age=300' } });
export const config: Config = { path: '/api/billing/catalog' };
