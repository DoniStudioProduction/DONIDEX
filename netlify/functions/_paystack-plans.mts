/** Public Paystack plan codes used by DONIDEX. Environment values override these defaults. */
export const PAYSTACK_PLAN_CODES = {
  premiumMonthly: process.env.PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE || 'PLN_fddms19tdyvx7qj',
  premiumYearly: process.env.PAYSTACK_PREMIUM_YEARLY_PLAN_CODE || 'PLN_jxtfbc7tqwiw4sj',
  businessMonthly: process.env.PAYSTACK_BUSINESS_MONTHLY_PLAN_CODE || 'PLN_ifmkg82hnjhsqsa',
  businessYearly: process.env.PAYSTACK_BUSINESS_YEARLY_PLAN_CODE || 'PLN_mcf5d8a1eik3i3x',
} as const;

export const PAYSTACK_PLAN_NAMES = new Map<string, string>([
  [PAYSTACK_PLAN_CODES.premiumMonthly, 'Premium'],
  [PAYSTACK_PLAN_CODES.premiumYearly, 'Premium'],
  [PAYSTACK_PLAN_CODES.businessMonthly, 'Business / Team'],
  [PAYSTACK_PLAN_CODES.businessYearly, 'Business / Team'],
]);

export const PAYSTACK_CONFIGURED_PLAN_CODES = Object.values(PAYSTACK_PLAN_CODES);
