import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type DonidexWorkspace = { profile?: Record<string, unknown>; businesses?: Record<string, unknown>[]; documents?: Record<string, unknown>[]; customers?: Record<string, unknown>[]; expenses?: Record<string, unknown>[]; settings?: Record<string, unknown> };

const requireDb = () => { if (!db) throw new Error('DONIDEX data storage is not configured yet.'); return db; };
export async function loadWorkspace(userId: string) { const snapshot = await getDoc(doc(requireDb(), 'users', userId)); return (snapshot.exists() ? snapshot.data().workspace : null) as DonidexWorkspace | null; }
export async function saveWorkspace(userId: string, workspace: DonidexWorkspace) { await setDoc(doc(requireDb(), 'users', userId), { workspace, updatedAt: Date.now() }, { merge: true }); }
export async function saveBusiness(userId: string, businessId: string, data: Record<string, unknown>) { await setDoc(doc(collection(requireDb(), 'users', userId, 'businesses'), businessId), { ...data, updatedAt: Date.now() }, { merge: true }); }
