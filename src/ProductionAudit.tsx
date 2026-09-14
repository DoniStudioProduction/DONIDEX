import { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './lib/firebase';

const OWNER_EMAIL = 'donistudioproduction@gmail.com';

type AuditResult = {
  ok: boolean;
  checkedAt: string;
  checks: {
    authenticatedOriginator: boolean;
    firebaseRuntimeKey: boolean;
    paystackSecret: boolean;
    paystackApi: boolean;
    allPlanCodesConfigured: boolean;
    planCodes: Record<string, boolean>;
  };
  paystackMessage: string;
};

export default function ProductionAudit() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => auth ? onAuthStateChanged(auth, value => setUser(value?.emailVerified ? value : null)) : undefined, []);
  if (user?.email?.toLowerCase() !== OWNER_EMAIL) return null;

  const runAudit = async () => {
    setBusy(true); setMessage('');
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/production-audit', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'Production audit could not be completed.');
      setResult(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Production audit failed.');
    } finally { setBusy(false); setOpen(true); }
  };

  return <>
    <button className="production-audit-launcher" onClick={() => void runAudit()} aria-label="Run DONIDEX production audit"><ShieldCheck size={15}/> Production Audit</button>
    {open && <div className="production-audit-backdrop" onClick={() => setOpen(false)}><section className="production-audit-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">ORIGINATOR CONTROL</p><h2>Production readiness audit</h2><p className="muted">Tasks 18–20 configuration and authenticated billing smoke check. No payment is charged.</p></div><button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close production audit"><X size={18}/></button></div>{busy && <p className="muted">Checking Firebase authentication and Paystack production connectivity…</p>}{message && <div className="owner-message" role="alert">{message}</div>}{result && <><div className={result.ok ? 'audit-status audit-ok' : 'audit-status audit-warn'}>{result.ok ? 'READY — production configuration passed.' : 'ACTION REQUIRED — one or more production checks need attention.'}</div><div className="audit-grid">{Object.entries({
          'Authenticated Originator': result.checks.authenticatedOriginator,
          'Firebase runtime API key': result.checks.firebaseRuntimeKey,
          'Paystack live secret': result.checks.paystackSecret,
          'Paystack API connection': result.checks.paystackApi,
          'Premium monthly plan code': result.checks.planCodes.premiumMonthly,
          'Premium yearly plan code': result.checks.planCodes.premiumYearly,
          'Business monthly plan code': result.checks.planCodes.businessMonthly,
          'Business yearly plan code': result.checks.planCodes.businessYearly,
        }).map(([label, pass]) => <div className="audit-row" key={label}><span>{label}</span><strong>{pass ? 'PASS' : 'MISSING / FAILED'}</strong></div>)}</div><p className="muted">{result.paystackMessage}</p><small className="muted">Checked {new Date(result.checkedAt).toLocaleString('en-NG')}</small></>}</section></div>}
  </>;
}
