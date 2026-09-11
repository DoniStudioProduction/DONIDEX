import { Check, Crown, CreditCard } from 'lucide-react';

type Plan = { name: string; monthly: string; annual: string; features: string[] };
const plans: Plan[] = [
 { name: 'Free', monthly: '₦0', annual: '₦0/year', features: ['Core invoicing', 'Quotations and receipts', 'Customers', 'Expenses', 'Basic reports'] },
 { name: 'Premium', monthly: '₦5,000/month', annual: '₦50,000/year', features: ['Everything in Free', 'Business Hub', 'Recurring billing', 'Payment follow-up', 'Secure invoice sharing', 'Advanced reports', 'Hardened backup and recovery'] },
 { name: 'Business / Team', monthly: '₦15,000/month', annual: '₦150,000/year', features: ['Everything in Premium', 'Multi-business operations', 'Team-ready workspace', 'Higher usage limits', 'Priority commercial features'] },
];

export default function Commercialization({ onUpgrade }: { onUpgrade?: (plan: 'premium' | 'business') => void }) {
 return <section className="panel"><div className="panel-head"><div><p className="eyebrow">DONIDEX COMMERCIAL</p><h2>Plans & billing</h2></div><CreditCard size={20}/></div><div className="price-grid">{plans.map((plan, index) => <article className={index === 1 ? 'featured' : ''} key={plan.name}><strong>{plan.name.toUpperCase()}</strong><b>{plan.monthly}</b><span>{plan.annual}</span><ul>{plan.features.map(feature => <li key={feature}><Check size={14}/>{feature}</li>)}</ul>{index > 0 && <button className="primary" onClick={() => onUpgrade?.(index === 1 ? 'premium' : 'business')}><Crown size={15}/> Upgrade</button>}</article>)}</div></section>;
}
