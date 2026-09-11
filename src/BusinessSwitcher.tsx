import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, ChevronDown, Edit3, Plus, Archive, X } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigured } from './lib/firebase';
import { loadWorkspace, saveWorkspace, type DonidexBusiness, type DonidexWorkspace } from './lib/workspace';

const activeFrom = (workspace: DonidexWorkspace) => workspace.businesses?.find(b => b.id === workspace.activeBusinessId && !b.archived) || workspace.businesses?.find(b => !b.archived) || workspace.businesses?.[0];

export default function BusinessSwitcher() {
  const [uid, setUid] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<DonidexWorkspace | null>(null);
  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState<DonidexBusiness | null>(null);
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!firebaseConfigured || !auth) return;
    return onAuthStateChanged(auth, async user => {
      if (!user?.emailVerified) return setUid(null);
      setUid(user.uid);
      try { setWorkspace(await loadWorkspace(user.uid)); } catch { setWorkspace(null); }
    });
  }, []);

  const active = useMemo(() => workspace ? activeFrom(workspace) : null, [workspace]);
  const businesses = workspace?.businesses?.filter(b => !b.archived) || [];

  const persist = async (next: DonidexWorkspace) => {
    if (!uid) return;
    setWorkspace(next);
    await saveWorkspace(uid, next);
    const selected = activeFrom(next);
    if (selected) localStorage.setItem('donidex:business', JSON.stringify(selected));
    window.location.reload();
  };

  const switchBusiness = async (businessId: string) => {
    if (!workspace || businessId === workspace.activeBusinessId) return setOpen(false);
    await persist({ ...workspace, activeBusinessId: businessId });
  };

  const openNew = () => { setEditor({ id: crypto.randomUUID(), name: '', archived: false, createdAt: Date.now() }); setName(''); };
  const openEdit = (business: DonidexBusiness) => { setEditor(business); setName(business.name); };

  const saveBusiness = async () => {
    if (!workspace || !editor || !name.trim()) return setNotice('Enter a business name.');
    const exists = workspace.businesses || [];
    const record = { ...editor, name: name.trim(), archived: false, updatedAt: Date.now() };
    const next = exists.some(b => b.id === editor.id) ? exists.map(b => b.id === editor.id ? record : b) : [...exists, record];
    await persist({ ...workspace, businesses: next, activeBusinessId: workspace.activeBusinessId || record.id });
  };

  const archiveBusiness = async (business: DonidexBusiness) => {
    if (!workspace) return;
    const live = businesses.filter(b => b.id !== business.id);
    if (!live.length) return setNotice('DONIDEX must keep at least one active business.');
    const nextBusinesses = (workspace.businesses || []).map(b => b.id === business.id ? { ...b, archived: true, updatedAt: Date.now() } : b);
    const nextActive = workspace.activeBusinessId === business.id ? live[0].id : workspace.activeBusinessId;
    await persist({ ...workspace, businesses: nextBusinesses, activeBusinessId: nextActive });
  };

  if (!uid || !workspace || !active) return null;
  return <>
    <div className="business-switcher"><button className="business-switcher-trigger" onClick={() => setOpen(v => !v)} aria-expanded={open}><Building2 size={15}/><span>{active.name}</span><ChevronDown size={14}/></button>{open && <div className="business-switcher-menu"><div className="business-menu-title">YOUR BUSINESSES</div>{businesses.map(b => <div className="business-option" key={b.id}><button onClick={() => switchBusiness(b.id)}><span>{b.name}</span>{b.id === active.id && <Check size={15}/>}</button><button className="business-mini" onClick={() => openEdit(b)} aria-label={`Edit ${b.name}`}><Edit3 size={14}/></button>{businesses.length > 1 && <button className="business-mini danger" onClick={() => archiveBusiness(b)} aria-label={`Archive ${b.name}`}><Archive size={14}/></button>}</div>)}<button className="business-add" onClick={openNew}><Plus size={15}/> Add business</button></div>}</div>
    {editor && <div className="business-editor-backdrop" onClick={() => setEditor(null)}><div className="business-editor" onClick={e => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">BUSINESS MANAGEMENT</p><h2>{workspace.businesses?.some(b => b.id === editor.id) ? 'Edit business' : 'Add business'}</h2></div><button className="icon-btn" onClick={() => setEditor(null)}><X size={18}/></button></div><label>Business name<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Doni Studio Production"/></label>{notice && <p className="business-notice">{notice}</p>}<button className="primary" onClick={saveBusiness}>{workspace.businesses?.some(b => b.id === editor.id) ? 'Save changes' : 'Create business'}</button></div></div>}
  </>;
}
