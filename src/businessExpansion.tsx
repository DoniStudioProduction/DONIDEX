import { BarChart3, BellRing, Boxes, CreditCard, Repeat2, UsersRound } from 'lucide-react';

const modules = [
 { title: 'Recurring invoices', copy: 'Schedule repeat billing profiles and track their next run.', icon: Repeat2 },
 { title: 'Products & services', copy: 'Maintain a reusable catalogue for faster documents and pricing.', icon: Boxes },
 { title: 'Payment follow-up', copy: 'Surface due-soon and overdue customers for reminders.', icon: BellRing },
 { title: 'Customer intelligence', copy: 'See billed, paid and outstanding activity by customer.', icon: UsersRound },
 { title: 'Collection tools', copy: 'Keep payment instructions and collection references consistent.', icon: CreditCard },
 { title: 'Revenue pulse', copy: 'Track collection health, revenue and operating spend.', icon: BarChart3 },
];

export default function BusinessExpansion() {
 return <section className="panel"><p className="eyebrow">BUSINESS HUB</p><h2>Growth and automation</h2><p className="muted">DONIDEX expansion modules are isolated here so they can be wired to the production backend without changing the core workspace.</p><div className="hub-grid large">{modules.map(({ title, copy, icon: Icon }) => <article className="hub-module" key={title}><Icon/><strong>{title}</strong><span>{copy}</span></article>)}</div></section>;
}
