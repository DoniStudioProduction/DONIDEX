import { useEffect, useState } from 'react';
import { Check, CreditCard, X } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './lib/firebase';

type Price = { key: string; name: string; interval: 'month'|'year'; amount: number; priceId: string };

export default function BillingCenter() {
 const [user, setUser] = useState<User | null>(null); const [open, setOpen] = useState(false); const [prices, setPrices] = useState<Price[]>([]); const [busy, setBusy] = useState(''); const [message, setMessage] = useState('');
 useEffect(() => { if (!auth) return; return onAuthStateChanged(auth, value => setUser(value?.emailVerified ? value : null)); }, []);
 const load = async () => { setMessage(''); try { const r = await fetch('/api/billing/catalog'); const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Could not load billing plans.'); setPrices(data.prices || []); setOpen(true); } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not load billing plans.'); setOpen(true); } };
 const checkout = async (priceId: string) => { if (!priceId) { setMessage('This recurring price is not configured yet.'); return; } setBusy(priceId); setMessage(''); try { const r = await fetch('/api/billing/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ priceId, customerEmail:user?.email, userId:user?.uid }) }); const data = await r.json(); if (!r.ok || !data.url) throw new Error(data.error || 'Checkout could not be started.'); window.location.href = data.url; } catch (e) { setMessage(e instanceof Error ? e.message : 'Checkout could not be started.'); setBusy(''); } };
 if (!user) return null;
 return <><button className="billing-launcher" onClick={() => void load()}><CreditCard size={16}/> Plans & Billing</button>{open && <div className="billing-backdrop" onClick={() => setOpen(false)}><section className="billing-modal" onClick={e => e.stopPropagation()}><div className="billing-head"><div><p className="eyebrow">DONIDEX COMMERCIAL</p><h2>Plans & billing</h2><p>Choose a recurring plan. Annual billing saves two months.</p></div><button className="icon-btn" onClick={() => setOpen(false)}><X size={18}/></button></div><div className="billing-grid">{prices.map(p => <article className="billing-card" key={p.key}><span>{p.name}</span><strong>₦{p.amount.toLocaleString('en-NG')}<small>/{p.interval}</small></strong><ul><li><Check size={14}/> Secure Stripe checkout</li><li><Check size={14}/> Cancel/manage through billing portal</li></ul><button className="primary" disabled={busy === p.priceId} onClick={() => void checkout(p.priceId)}>{busy === p.priceId ? 'Opening checkout…' : `Choose ${p.interval}`}</button></article>)}</div>{message && <div className="billing-message">{message}</div>}<small className="billing-note">Free remains ₦0. Premium: ₦5,000/month or ₦50,000/year. Business / Team: ₦15,000/month or ₦150,000/year.</small></section></div>}</>;
}
