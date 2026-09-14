import { useMemo, useState } from 'react';
import { addDoc, collection, doc, getDocs, limit, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

type Profile = { uid: string; email?: string; displayName?: string; providers?: string[]; photoURL?: string | null };
type Wallet = { balance?: number; currency?: string; updatedAt?: unknown };
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
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const amountNumber = useMemo(() => Math.max(0, Number(amount.replace(/,/g, '')) || 0), [amount]);
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
      if (!walletSnap.empty) setBalance((walletSnap.docs[0].data() as Wallet).balance || 0); else setBalance(0);
      const txSnap = await getDocs(query(collection(db, 'ownerCreditTransactions'), where('targetUid', '==', profile.uid), limit(20)));
      setHistory(txSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.createdAt?.seconds || '').localeCompare(String(a.createdAt?.seconds || ''))));
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not load wallet information.'); }
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
      setHistory(h => [{ id: txRef.id, targetUid: selected.uid, amount: amountNumber, reason: reason.trim(), proofReference: proofReference.trim(), source: 'originator-recovery' }, ...h]);
      setAmount(''); setProofReference('');
      setMessage(`${money(amountNumber)} credited to ${selected.email || selected.displayName || 'the customer'} successfully.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not complete the manual credit.'); }
    finally { setBusy(false); }
  };

  const loadRecentTransactions = async () => {
    setBusy(true); setMessage('');
    try {
      const snap = await getDocs(query(collection(db, 'ownerCreditTransactions'), limit(50)));
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not load transaction history.'); }
    finally { setBusy(false); }
  };

  const grantSubscription = async () => {
    if (!selected) return setMessage('Select the customer account first.');
    const plan = 'Premium';
    const end = new Date(); end.setMonth(end.getMonth() + 1);
    setBusy(true); setMessage('');
    try {
      await addDoc(collection(db, 'ownerTopUps'), { targetUid: selected.uid, targetEmail: selected.email || '', plan, interval: 'month', duration: 1, startsAt: new Date().toISOString(), endsAt: end.toISOString(), reason: reason.trim(), proofReference: proofReference.trim(), createdByUid: owner.uid, createdByEmail: OWNER_EMAIL, createdAt: serverTimestamp(), source: 'owner-manual-recovery' });
      setMessage('Premium access recovery recorded for 1 month.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not record subscription recovery.'); }
    finally { setBusy(false); }
  };

  return <div className="owner-topup-backdrop" onClick={onClose}><section className="owner-topup-modal" onClick={e => e.stopPropagation()}>
    <div className="modal-head"><div><p className="eyebrow">ORIGINATOR CONTROL CENTER</p><h2>DONIDEX Owner Console</h2><p className="muted">Manage registered users, wallet recovery, delayed Paystack credits and owner audit records.</p></div><button className="icon-btn" onClick={onClose}>×</button></div>
    <div className="owner-warning">Restricted to the verified DONIDEX Originator account: <strong>{OWNER_EMAIL}</strong>. Every manual credit records the amount, reason, payment reference and originator identity.</div>
    <div className="owner-tabs"><button className={tab === 'users' ? 'primary' : 'secondary'} onClick={() => setTab('users')}>Registered users</button><button className={tab === 'credit' ? 'primary' : 'secondary'} onClick={() => setTab('credit')} disabled={!selected}>Wallet & credit</button><button className={tab === 'transactions' ? 'primary' : 'secondary'} onClick={() => { setTab('transactions'); void loadRecentTransactions(); }}>Credit audit</button></div>

    {tab === 'users' && <div><div className="owner-search"><label>Search registered user by email<input value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" /></label><button className="primary" onClick={() => void search()} disabled={busy}>Search users</button></div>{results.length > 0 && <div className="owner-results">{results.map(profile => <button className="owner-result" key={profile.uid} onClick={() => void selectUser(profile)}><div><strong>{profile.displayName || 'DONIDEX User'}</strong><span>{profile.email || 'No email'}</span></div><small>{(profile.providers || []).join(', ') || 'Account'}</small></button>)}</div>}</div>}

    {tab === 'credit' && selected && <div><div className="owner-selected"><strong>{selected.displayName || 'DONIDEX User'}</strong><span>{selected.email}</span><small>UID: {selected.uid}</small><b>Current wallet: {balance === null ? 'Loading…' : money(balance)}</b></div><div className="owner-form-grid"><label>Credit amount (₦)<input inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></label><label>Payment reference<input value={proofReference} onChange={e => setProofReference(e.target.value)} placeholder="Paystack/transfer/receipt reference" /></label></div><label>Reason<textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} /></label><div className="owner-actions"><button className="secondary" onClick={() => void grantSubscription()} disabled={busy}>Recover 1-month Premium</button><button className="primary" onClick={() => void grantCredit()} disabled={busy}>{busy ? 'Processing…' : `Credit ${money(amountNumber)}`}</button></div>{history.length > 0 && <div className="receipt-mini"><p className="eyebrow">RECENT MANUAL CREDITS</p>{history.slice(0,5).map(item => <span key={item.id}>{money(item.amount)} · {item.proofReference || 'manual'} · {item.reason || 'Originator credit'}</span>)}</div>}</div>}

    {tab === 'transactions' && <div className="table-list">{history.length ? history.map(item => <div className="table-row" key={item.id}><div><strong>{item.targetEmail || item.targetUid}</strong><span>{item.reason || 'Manual credit'}</span></div><b>{money(item.amount)}</b><em>Originator credit</em><span>{item.proofReference || 'No reference'}</span></div>) : <p className="muted">No manual-credit records found.</p>}</div>}
    {message && <div className="owner-message">{message}</div>}
  </section></div>;
}
