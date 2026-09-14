import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function SharedDocument({ token }: { token: string }) {
 const [state,setState]=useState<'loading'|'ready'|'missing'|'error'>('loading'); const [data,setData]=useState<any>(null);
 useEffect(()=>{let live=true;(async()=>{if(!db){if(live)setState('error');return;}try{const snap=await getDoc(doc(db,'sharedDocuments',token));if(!live)return;if(!snap.exists()||snap.data().published!==true){setState('missing');return;}setData(snap.data());setState('ready');}catch{if(live)setState('error');}})();return()=>{live=false}},[token]);
 if(state==='loading')return <main className="shared-document"><div className="shared-card">Loading secure document…</div></main>;
 if(state!=='ready')return <main className="shared-document"><div className="shared-card"><h1>DONIDEX</h1><h2>Document unavailable</h2><p>This share link is invalid, expired, or no longer published.</p></div></main>;
 const title=data.kind==='Quotation'?'Quotation':'Invoice';
 return <main className="shared-document"><div className="shared-card"><div className="shared-brand">DONIDEX</div><p className="eyebrow">SHARED {title.toUpperCase()}</p><h1>{data.number}</h1><div className="shared-grid"><div><span>Customer</span><strong>{data.customer}</strong></div><div><span>Status</span><strong>{data.status}</strong></div><div><span>Due</span><strong>{data.due||'—'}</strong></div><div><span>Total</span><strong>₦{Number(data.total||0).toLocaleString('en-NG')}</strong></div></div><p className="shared-note">This document was securely shared from DONIDEX using a unique access token.</p><button onClick={()=>window.print()} className="primary">Print / Save PDF</button></div></main>;
}
