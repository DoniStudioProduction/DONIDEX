import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigured } from './lib/firebase';
import { applyWorkspaceToLocalStorage, loadWorkspace, saveBusiness, saveWorkspace, workspaceFromLocalStorage, type DonidexWorkspace } from './lib/workspace';

const SNAPSHOT_KEY = 'donidex:cloud-snapshot';
const RESTORE_KEY = 'donidex:cloud-restore-user';
const watchedKeys = ['profile', 'business', 'docs', 'customers', 'expenses', 'settings'];

const readSnapshot = () => watchedKeys.map(key => [key, localStorage.getItem(`donidex:${key}`)] as const);
const snapshotText = () => JSON.stringify(readSnapshot());

export default function WorkspaceBridge() {
  const userRef = useRef<string | null>(null);
  const lastSaved = useRef('');

  useEffect(() => {
    if (!firebaseConfigured || !auth) return;
    let timer: number | undefined;
    const stop = onAuthStateChanged(auth, async user => {
      if (!user?.emailVerified) { userRef.current = null; return; }
      userRef.current = user.uid;
      try {
        const remote = await loadWorkspace(user.uid);
        if (remote) {
          applyWorkspaceToLocalStorage(remote);
          lastSaved.current = snapshotText();
          if (sessionStorage.getItem(RESTORE_KEY) !== user.uid) {
            sessionStorage.setItem(RESTORE_KEY, user.uid);
            window.location.reload();
            return;
          }
        } else {
          const local = workspaceFromLocalStorage();
          await saveWorkspace(user.uid, local);
          const business = local.businesses?.[0];
          if (business) await saveBusiness(user.uid, business.id, business);
          applyWorkspaceToLocalStorage(local);
          lastSaved.current = snapshotText();
        }
      } catch (error) {
        console.warn('DONIDEX cloud workspace sync unavailable:', error);
      }
      timer = window.setInterval(async () => {
        const uid = userRef.current;
        if (!uid) return;
        const current = snapshotText();
        if (current === lastSaved.current) return;
        try {
          const local = workspaceFromLocalStorage();
          await saveWorkspace(uid, local);
          const business = local.businesses?.[0];
          if (business) await saveBusiness(uid, business.id, business);
          localStorage.setItem(SNAPSHOT_KEY, current);
          lastSaved.current = current;
        } catch (error) {
          console.warn('DONIDEX cloud workspace save unavailable:', error);
        }
      }, 2000);
    });
    return () => { stop(); if (timer) window.clearInterval(timer); };
  }, []);

  return null;
}
