import { useMemo, useState } from 'react';
import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

const OWNER_EMAIL = 'donistudioproduction@gmail.com';
type Profile = { uid: string; email?: string; displayName?: string; providers?: string[]; photoURL?: string | null };

export default function OwnerTopUp({ onClose }: { onClose: () => void }) {
  const owner = auth?.currentUser;
  const isOwner = owner?.email?.toLowerCase() === OWNER_EMAIL;
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<'Premium' | 'Business / Team'>('Premium');
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [duration, setDuration] = useState(1);
  const [reason, setReason] = useState('Customer payment verified from receipt proof.');
  const [proofReference, setProofReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const durationLabel = useMemo(() => interval === 'month' ? `${duration} month${duration === 1 ? '' : 's'}` : `${duration} year${duration === 1 ? '' : 's'}`, [duration, interval]);
  if (!isOwner || !db) return null;
  const search = async () => {
    setMessage(''); setSelected(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized) return setMessage('Enter the customer email used for the DONIDEX account.');
    try { const snap = await getDocs(query(collection(db, 'userProfiles'), where('email', '==', normalized), limit(10))); const found = snap.docs.map(d => d.data() as Profile); setResults(found); if (!found.length) setMessage('No matching DONIDEX account found.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not search the user directory.'); }
  };
  const grant = async () => {
    if (!selected) return setMessage('Select the customer account first.');
    if (!proofReference.trim()) return setMessage('Add the payment receipt/reference used to verify the payment.');
    setBusy(true); setMessage('');
    try {
      const start = new Date(); const end = new Date(start);
      if (interval === 'month') end.setMonth(end.getMonth() + duration); else end.setFullYear(end.getFullYear() + duration);
      await setDoc(doc(db, 'ownerTopUps', selected.uid), { targetUid: selected.uid, targetEmail: selected.email || email.trim().toLowerCase(), targetDisplayName: selected.displayName || '', providers: selected.providers || [], plan, interval, duration, startsAt: start.toISOString(), endsAt: end.toISOString(), reason: reason.trim(), proofReference: proofReference.trim(), createdByUid: owner?.uid || '', createdByEmail: OWNER_EMAIL, createdAt: serverTimestamp(), source: 'owner-manual-recovery' }, { merge: true });
      setMessage(`${plan} access granted for ${durationLabel}.`); setProofReference('');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save the manual top-up.'); } finally { setBusy(false); }
  };
  return <div className="owner-topup-backdrop" onClick={onClose}><section className="owner-topup-modal" onClick={e => e.stopPropagation()}>
    <div className="modal-head"><div><p className="eyebrow">OWNER CONTROL</p><h2>Owner Top-Up</h2><p className="muted">Recover a verified customer subscription without waiting for Paystack activation.</p></div><button className="icon-btn" onClick={onClose}>×</button></div>
    <div className="owner-warning">Only <strong>{OWNER_EMAIL}</strong> can use this recovery console. Verify the customer's payment proof before granting access.</div>
    <div className="owner-search"><label>Search customer email<input value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" /></label><button className="primary" onClick={() => void search()} disabled={busy}>Search account</button></div>
    {results.length > 0 && <div className="owner-results">{results.map(profile => <button className={selected?.uid === profile.uid ? 'owner-result selected' : 'owner-result'} key={profile.uid} onClick={() => setSelected(profile)}><div><strong>{profile.displayName || 'DONIDEX User'}</strong><span>{profile.email}</span></div><small>{(profile.providers || []).join(', ') || 'Account'}</small></button>)}</div>}
    {selected && <div className="owner-selected"><strong>{selected.displayName || 'DONIDEX User'}</strong><span>{selected.email}</span><small>UID: {selected.uid}</small></div>}
    <div className="owner-form-grid"><label>Plan<select value={plan} onChange={e => setPlan(e.target.value as 'Premium'|'Business / Team')}><option>Premium</option><option>Business / Team</option></select></label><label>Billing period<select value={interval} onChange={e => setInterval(e.target.value as 'month'|'year')}><option value="month">Monthly</option><option value="year">Yearly</option></select></label><label>Duration<select value={duration} onChange={e => setDuration(Number(e.target.value))}>{[1,2,3,6,12].map(n => <option key={n} value={n}>{n} {interval === 'month' ? 'month' : 'year'}{n === 1 ? '' : 's'}</option>)}</select></label><label>Receipt / payment reference<input value={proofReference} onChange={e => setProofReference(e.target.value)} placeholder="Receipt ID, transfer reference, or email reference" /></label></div>
    <label>Recovery reason<textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} /></label>
    <div className="owner-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy || !selected} onClick={() => void grant()}>{busy ? 'Granting…' : `Grant ${plan} · ${durationLabel}`}</button></div>
    {message && <div className="owner-message">{message}</div>}
  </section></div>;
}
