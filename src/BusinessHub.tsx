import { useMemo, useState } from 'react';
import { BarChart3, BellRing, Boxes, CalendarClock, ChevronRight, LineChart, Package, Plus, Sparkles, X } from 'lucide-react';
import './businessHub.css';

type HubTab = 'Products' | 'Recurring' | 'Follow-up' | 'Insights';
type Product = { id: string; name: string; price: number; type: 'Product' | 'Service' };
type Recurring = { id: string; customer: string; amount: number; interval: 'Monthly' | 'Yearly'; next: string };

type Doc = { customer: string; total: number; status: string; due: string };

const load = <T,>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(`donidex:${key}`); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } };
const save = <T,>(key: string, value: T) => localStorage.setItem(`donidex:${key}`, JSON.stringify(value));
const money = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function BusinessHub() {
 const [open, setOpen] = useState(false);
 const [tab, setTab] = useState<HubTab>('Products');
 const [products, setProducts] = useState<Product[]>(() => load('hub_products', []));
 const [recurring, setRecurring] = useState<Recurring[]>(() => load('hub_recurring', []));
 const docs = load<Doc[]>('docs', []);
 const customers = load<{ name: string; outstanding: number }[]>('customers', []);
 const overdue = docs.filter(d => d.status === 'Overdue');
 const outstanding = docs.filter(d => d.status !== 'Paid').reduce((sum, d) => sum + d.total, 0);
 const revenue = docs.filter(d => d.status === 'Paid').reduce((sum, d) => sum + d.total, 0);
 const collectionRate = revenue + outstanding ? Math.round((revenue / (revenue + outstanding)) * 100) : 0;
 const customerRisk = useMemo(() => [...customers].sort((a, b) => b.outstanding - a.outstanding).slice(0, 5), [customers]);
 const addProduct = () => { const next = { id: crypto.randomUUID(), name: 'New service', price: 0, type: 'Service' as const }; const value = [next, ...products]; setProducts(value); save('hub_products', value); };
 const addRecurring = () => { const next = { id: crypto.randomUUID(), customer: 'New customer', amount: 0, interval: 'Monthly' as const, next: new Date().toISOString().slice(0, 10) }; const value = [next, ...recurring]; setRecurring(value); save('hub_recurring', value); };
 return <>
  <button className="hub-launcher" onClick={() => setOpen(true)}><Sparkles size={16}/> Business Hub</button>
  {open && <div className="hub-backdrop" onClick={() => setOpen(false)}><section className="hub-modal" onClick={e => e.stopPropagation()}>
   <header className="hub-header"><div><p className="hub-eyebrow">DONIDEX BUSINESS HUB</p><h2>Growth & automation</h2><p>Turn everyday business activity into follow-up, recurring revenue and clearer decisions.</p></div><button className="hub-close" onClick={() => setOpen(false)} aria-label="Close Business Hub"><X size={18}/></button></header>
   <div className="hub-tabs">{(['Products','Recurring','Follow-up','Insights'] as HubTab[]).map(item => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
   {tab === 'Products' && <div className="hub-content"><div className="hub-section-head"><div><strong>Products & services</strong><span>Create a reusable catalogue for faster invoicing.</span></div><button className="hub-primary" onClick={addProduct}><Plus size={15}/> Add item</button></div>{products.length === 0 ? <div className="hub-empty"><Package size={30}/><strong>No catalogue items yet</strong><span>Add your first product or service and it will stay available for future documents.</span><button className="hub-primary" onClick={addProduct}>Create first item</button></div> : <div className="hub-list">{products.map(p => <div className="hub-row" key={p.id}><div><strong>{p.name}</strong><span>{p.type}</span></div><b>{money(p.price)}</b><ChevronRight size={16}/></div>)}</div>}</div>}
   {tab === 'Recurring' && <div className="hub-content"><div className="hub-section-head"><div><strong>Recurring invoices</strong><span>Prepare predictable monthly or yearly billing.</span></div><button className="hub-primary" onClick={addRecurring}><Plus size={15}/> Add profile</button></div>{recurring.length === 0 ? <div className="hub-empty"><CalendarClock size={30}/><strong>No recurring profiles yet</strong><span>Set up a customer, amount and billing interval for repeat revenue.</span><button className="hub-primary" onClick={addRecurring}>Create first profile</button></div> : <div className="hub-list">{recurring.map(r => <div className="hub-row" key={r.id}><div><strong>{r.customer}</strong><span>{r.interval} · Next {r.next}</span></div><b>{money(r.amount)}</b><ChevronRight size={16}/></div>)}</div>}</div>}
   {tab === 'Follow-up' && <div className="hub-content"><div className="hub-section-head"><div><strong>Payment follow-up</strong><span>Prioritize overdue customers before cash gets stuck.</span></div><BellRing size={20}/></div>{overdue.length === 0 ? <div className="hub-empty"><BellRing size={30}/><strong>No overdue invoices</strong><span>Your current invoice list has no overdue balance.</span></div> : <div className="hub-list">{overdue.map((d, i) => <div className="hub-row" key={`${d.customer}-${i}`}><div><strong>{d.customer}</strong><span>Due {d.due}</span></div><b>{money(d.total)}</b><button className="hub-link" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Payment reminder from DONIDEX: ${d.customer}, outstanding ${money(d.total)}.`)}`, '_blank')}>WhatsApp</button></div>)}</div>}</div>}
   {tab === 'Insights' && <div className="hub-content"><div className="pulse-grid"><article><LineChart size={20}/><span>Collection rate</span><strong>{collectionRate}%</strong></article><article><BarChart3 size={20}/><span>Outstanding</span><strong>{money(outstanding)}</strong></article><article><Boxes size={20}/><span>Catalogue</span><strong>{products.length}</strong></article><article><CalendarClock size={20}/><span>Recurring</span><strong>{recurring.length}</strong></article></div><div className="hub-section-head compact"><div><strong>Customer intelligence</strong><span>Highest outstanding balances to review first.</span></div></div><div className="hub-list">{customerRisk.length === 0 ? <div className="hub-empty small"><span>No customer balances available yet.</span></div> : customerRisk.map(c => <div className="hub-row" key={c.name}><div><strong>{c.name}</strong><span>Outstanding balance</span></div><b>{money(c.outstanding)}</b></div>)}</div></div>}
   <footer className="hub-footer">Business Hub data is saved locally for now and is ready for the next authenticated cloud-sync batch.</footer>
  </section></div>}
 </>;
}
