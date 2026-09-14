import { useMemo, useState } from 'react';
import { collection, doc, getDocs, limit, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

type Profile = { uid: string; email?: string; displayName?: string; providers?: string[]; photoURL?: string | null };
type Wallet = { balance?: number; currency?: string; updatedAt?: unknown };
type AuditItem = { id: string; kind: 'credit' | 'subscription'; targetEmail?: string; targetUid?: string; amount?: number; plan?: string; interval?: string; duration?: number; reason?: string; proofReference?: string; createdAt?: any; endsAt?: string };
const OWNER_EMAIL = 'donistudioproduction@gmail.com';
const money = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

export default function OwnerTopUp({ onClose }: { onClose: () => void }) {
  const owner = auth?.currentUser;
  const isOwner = owner?.email?.toLowerCase() === OWNER_EMAIL && owner?.emailVerified === true;
  const [tab, setTab] = useState<'users' | 'credit' | 'transactions'>('users');
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Customer payment verified; Paystack credit delayed or callback issue.');
  const [proofReference, setProofReference] = useState('');
  const [recoveryPlan, setRecoveryPlan] = useState('Premium');
  const [recoveryInterval, setRecoveryInterval] = useState<'month' | 'year'>('month');
  const [recoveryDuration, setRecoveryDuration] = useState('1');
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<AuditItem[]>([]);

  const amountNumber = useMemo(() => Math.max(0, Number(amount.replace(/,/g, '')) || 0), [amount]);
  const durationNumber = useMemo(() => Math.max(1, Math.floor(Number(recoveryDuration) || 1)), [recoveryDuration]);
  if (!isOwner || !db) return null;

  const search = async () => {
    setMessage(''); setSelected(null); setBalance(null); setHistory([]);
    const normalized = email.trim().toLowerCase();
    if (!normalized) return setMessage('Enter the customer email used for the DONIDEX account.');
    setBusy(true);
    try {
      const snap = await getDocs(query(collection(db, 'userProfiles'), where('email', '==', normalized), limit(10)));
      const found = snap.docs.map(d => ({ uid: d.id, ...(d.data() as Omit<Profile, 'uid'>) }));
      setResults(found);
      if (!found.length) setMessage('No matching DONIDEX account found.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not search the user directory.'); }
    finally { setBusy(false); }
  };

  const selectUser = async (profile: Profile) => {
    setSelected(profile); setMessage(''); setTab('credit'); setBusy(true);
    try {
      const walletSnap = await getDocs(query(collection(db, 'userWallets'), where('__name__', '==', profile.uid), limit(1)));
      setBalance(walletSnap.empty ? 0 : Number((walletSnap.docs[0].data() as Wallet).balance || 0));
      const [txSnap, subSnap] = await Promise.all([
        getDocs(query(collection(db, 'ownerCreditTransactions'), where('targetUid', '==', profile.uid), limit(20))),
        getDocs(query(collection(db, 'ownerTopUps'), where('targetUid', '==', profile.uid), limit(20)))
      ]);
      const credits: AuditItem[] = txSnap.docs.map(d => ({ id: d.id, kind: 'credit', ...d.data() } as AuditItem));
      const subs: AuditItem[] = subSnap.docs.map(d => ({ id: d.id, kind: 'subscription', ...d.data() } as AuditItem));
      setHistory([...credits, ...subs]);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not load wallet or recovery information.'); }
    finally { setBusy(false); }
  };

  const grantCredit = async () => {
    if (!selected) return setMessage('Select the customer account first.');
    if (!amountNumber) return setMessage('Enter a valid credit amount.');
    if (!proofReference.trim()) return setMessage('Add the payment receipt/reference used to verify the payment.');
    if (!reason.trim()) return setMessage('Add a reason for the manual credit.');
    setBusy(true); setMessage('');
    try {
      const walletRef = doc(db, 'userWallets', selected.uid);
      const txRef = doc(collection(db, 'ownerCreditTransactions'));
      await runTransaction(db, async tx => {
        const walletSnap = await tx.get(walletRef);
        const current = Number(walletSnap.data()?.balance || 0);
        tx.set(walletRef, { balance: current + amountNumber, currency: 'NGN', updatedAt: serverTimestamp() }, { merge: true });
        tx.set(txRef, { type: 'manual-credit', targetUid: selected.uid, targetEmail: selected.email || '', amount: amountNumber, currency: 'NGN', reason: reason.trim(), proofReference: proofReference.trim(), createdByUid: owner.uid, createdByEmail: OWNER_EMAIL, createdAt: serverTimestamp(), source: 'originator-recovery' });
      });
      setBalance((balance || 0) + amountNumber);
      setHistory(h => [{ id: txRef.id, kind: 'credit', targetUid: selected.uid, targetEmail: selected.email || '', amount: amountNumber, reason: reason.trim(), proofReference: proofReference.trim() }, ...h]);
      setAmount(''); setProofReference('');
      setMessage(`${money(amountNumber)} credited to ${selected.email || selected.displayName || 'the customer'} successfully.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not complete the manual credit.'); }
    finally { setBusy(false); }
  };

  const loadRecentTransactions = async () => {
    setBusy(true); setMessage('');
    try {
      const [txSnap, subSnap] = await Promise.all([
        getDocs(query(collection(db, 'ownerCreditTransactions'), limit(50))),
        getDocs(query(collection(db, 'ownerTopUps'), limit(50)))
      ]);
      const credits: AuditItem[] = txSnap.docs.map(d => ({ id: d.id, kind: 'credit', ...d.data() } as AuditItem));
      const subs: AuditItem[] = subSnap.docs.map(d => ({ id: d.id, kind: 'subscription', ...d.data() } as AuditItem));
      setHistory([...credits, ...subs]);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not load originator audit history.'); }
    finally { setBusy(false); }
  };

  const grantSubscription = async () => {
    if (!selected) return setMessage('Select the customer account first.');
    if (!reason.trim()) return setMessage('Add a reason for the subscription recovery.');
    if (!proofReference.trim()) return setMessage('Add the payment receipt/reference used to verify the recovery.');
    const startsAt = new Date();
    const end = new Date(startsAt);
    if (recoveryInterval === 'year') end.setFullYear(end.getFullYear() + durationNumber);
    else end.setMonth(end.getMonth() + durationNumber);
    setBusy(true); setMessage('');
    try {
      const profileRef = doc(db, 'userProfiles', selected.uid);
      const auditRef = doc(collection(db, 'ownerTopUps'));
      const override = {
        plan: recoveryPlan,
        interval: recoveryInterval,
        duration: durationNumber,
        status: 'active',
        startsAt: startsAt.toISOString(),
        endsAt: end.toISOString(),
        reason: reason.trim(),
        proofReference: proofReference.trim(),
        grantedByUid: owner.uid,
        grantedByEmail: OWNER_EMAIL,
        grantedAt: serverTimestamp(),
        source: 'originator-manual-recovery'
      };
      await runTransaction(db, async tx => {
        tx.set(profileRef, { subscriptionOverride: override }, { merge: true });
        tx.set(auditRef, { targetUid: selected.uid, targetEmail: selected.email || '', plan: recoveryPlan, interval: recoveryInterval, duration: durationNumber, startsAt: startsAt.toISOString(), endsAt: end.toISOString(), status: 'active', reason: reason.trim(), proofReference: proofReference.trim(), createdByUid: owner.uid, createdByEmail: OWNER_EMAIL, createdAt: serverTimestamp(), source: 'owner-manual-recovery' });
      });
      setHistory(h => [{ id: auditRef.id, kind: 'subscription', targetUid: selected.uid, targetEmail: selected.email || '', plan: recoveryPlan, interval: recoveryInterval, duration: durationNumber, reason: reason.trim(), proofReference: proofReference.trim(), endsAt: end.toISOString() }, ...h]);
      setMessage(`${recoveryPlan} ${recoveryInterval} entitlement activated for ${durationNumber} ${recoveryInterval}${durationNumber === 1 ? '' : 's'}.`);
      setProofReference('');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not activate subscription recovery.'); }
    finally { setBusy(false); }
  };

  return <div className="owner-topup-backdrop" onClick={onClose}><section className="owner-topup-modal" onClick={e => e.stopPropagation()}>
    <div className="modal-head"><div><p className="eyebrow">ORIGINATOR CONTROL CENTER</p><h2>DONIDEX Owner Console</h2><p className="muted">Manage registered users, wallet recovery, subscription recovery and originator audit records.</p></div><button className="icon-btn" onClick={onClose}>×</button></div>
    <div className="owner-warning">Restricted to the verified DONIDEX Originator account: <strong>{OWNER_EMAIL}</strong>. Recovery actions record the amount/plan, reason, payment reference and originator identity.</div>
    <div className="owner-tabs"><button className={tab === 'users' ? 'primary' : 'secondary'} onClick={() => setTab('users')}>Registered users</button><button className={tab === 'credit' ? 'primary' : 'secondary'} onClick={() => setTab('credit')} disabled={!selected}>Wallet & recovery</button><button className={tab === 'transactions' ? 'primary' : 'secondary'} onClick={() => { setTab('transactions'); void loadRecentTransactions(); }}>Full audit</button></div>

    {tab === 'users' && <div><div className="owner-search"><label>Search registered user by email<input value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" /></label><button className="primary" onClick={() => void search()} disabled={busy}>Search users</button></div>{results.length > 0 && <div className="owner-results">{results.map(profile => <button className="owner-result" key={profile.uid} onClick={() => void selectUser(profile)}><div><strong>{profile.displayName || 'DONIDEX User'}</strong><span>{profile.email || 'No email'}</span></div><small>{(profile.providers || []).join(', ') || 'Account'}</small></button>)}</div>}</div>}

    {tab === 'credit' && selected && <div><div className="owner-selected"><strong>{selected.displayName || 'DONIDEX User'}</strong><span>{selected.email}</span><small>UID: {selected.uid}</small><b>Current wallet: {balance === null ? 'Loading…' : money(balance)}</b></div><div className="owner-form-grid"><label>Credit amount (₦)<input inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></label><label>Payment reference<input value={proofReference} onChange={e => setProofReference(e.target.value)} placeholder="Paystack/transfer/receipt reference" /></label></div><label>Reason<textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} /></label><div className="owner-form-grid"><label>Recovery plan<select value={recoveryPlan} onChange={e => setRecoveryPlan(e.target.value)}><option>Premium</option><option>Business/Team</option></select></label><label>Billing interval<select value={recoveryInterval} onChange={e => setRecoveryInterval(e.target.value as 'month' | 'year')}><option value="month">Monthly</option><option value="year">Yearly</option></select></label><label>Duration<input type="number" min="1" step="1" value={recoveryDuration} onChange={e => setRecoveryDuration(e.target.value)} /></label></div><div className="owner-actions"><button className="secondary" onClick={() => void grantSubscription()} disabled={busy}>Recover selected subscription</button><button className="primary" onClick={() => void grantCredit()} disabled={busy}>{busy ? 'Processing…' : `Credit ${money(amountNumber)}`}</button></div>{history.length > 0 && <div className="receipt-mini"><p className="eyebrow">RECENT RECOVERY ACTIVITY</p>{history.slice(0,5).map(item => <span key={item.id}>{item.kind === 'credit' ? `${money(item.amount || 0)} · wallet credit · ${item.proofReference || 'manual'}` : `${item.plan} ${item.interval} · ${item.duration} · ${item.proofReference || 'recovery'}`}</span>)}</div>}</div>}

    {tab === 'transactions' && <div className="table-list">{history.length ? history.map(item => <div className="table-row" key={item.id}><div><strong>{item.targetEmail || item.targetUid}</strong><span>{item.kind === 'credit' ? (item.reason || 'Manual wallet credit') : `${item.plan} ${item.interval} recovery · ${item.duration}`}</span></div>{item.kind === 'credit' ? <b>{money(item.amount || 0)}</b> : <b>{item.plan}</b>}<em>{item.kind === 'credit' ? 'Wallet credit' : 'Subscription recovery'}</em><span>{item.proofReference || 'No reference'}</span></div>) : <p className="muted">No originator audit records found.</p>}</div>}
    {message && <div className="owner-message">{message}</div>}
  </section></div>;
}
