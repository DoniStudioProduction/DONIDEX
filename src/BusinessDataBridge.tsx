import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigured } from './lib/firebase';
import { loadWorkspace, loadBusinessData, saveBusinessData, workspaceFromLocalStorage } from './lib/workspace';

const snapshot = () => {
  const read = (key: string) => { try { const raw = localStorage.getItem(`donidex:${key}`); return raw ? JSON.parse(raw) : undefined; } catch { return undefined; } };
  return { documents: read('docs') || [], customers: read('customers') || [], expenses: read('expenses') || [], settings: read('settings'), business: read('business'), hubProducts: read('hub_products') || [], hubRecurring: read('hub_recurring') || [] };
};
const apply = (data: ReturnType<typeof snapshot>) => {
  const write = (key: string, value: unknown) => { if (value !== undefined) localStorage.setItem(`donidex:${key}`, JSON.stringify(value)); };
  write('docs', data.documents || []); write('customers', data.customers || []); write('expenses', data.expenses || []); if (data.settings) write('settings', data.settings); if (data.business) write('business', data.business); write('hub_products', data.hubProducts || []); write('hub_recurring', data.hubRecurring || []);
};

export default function BusinessDataBridge() {
  useEffect(() => {
    if (!firebaseConfigured || !auth) return;
    let stopped = false; let ready = false; let last = '';
    const start = async (userId: string) => {
      if (!userId || stopped) return;
      const workspace = await loadWorkspace(userId) || workspaceFromLocalStorage();
      const active = workspace.businesses?.find(b => b.id === workspace.activeBusinessId && !b.archived) || workspace.businesses?.find(b => !b.archived) || workspace.businesses?.[0];
      if (!active || stopped) return;
      const remote = await loadBusinessData(userId, active.id);
      if (remote) { apply({ documents: remote.documents || [], customers: remote.customers || [], expenses: remote.expenses || [], settings: remote.settings, business: active, hubProducts: remote.hubProducts || [], hubRecurring: remote.hubRecurring || [] }); window.setTimeout(() => window.location.reload(), 50); return; }
      const initial = snapshot(); await saveBusinessData(userId, active.id, initial); ready = true; last = JSON.stringify(initial);
    };
    const unsubscribe = onAuthStateChanged(auth, user => { ready = false; last = ''; if (!user?.emailVerified) return; void start(user.uid); });
    const timer = window.setInterval(async () => {
      if (!ready || stopped) return; const user = auth?.currentUser; if (!user?.emailVerified) return;
      const current = snapshot(); const serialized = JSON.stringify(current); if (serialized === last) return; last = serialized;
      const workspace = await loadWorkspace(user.uid); const active = workspace?.businesses?.find(b => b.id === workspace.activeBusinessId && !b.archived) || workspace?.businesses?.find(b => !b.archived); if (active) await saveBusinessData(user.uid, active.id, current);
    }, 2500);
    return () => { stopped = true; unsubscribe(); window.clearInterval(timer); };
  }, []);
  return null;
}
