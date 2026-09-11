import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type DonidexBusiness = { id: string; name: string; phone?: string; email?: string; address?: string; tax?: number; prefix?: string; next?: number; archived?: boolean; createdAt?: number; updatedAt?: number };
export type DonidexBusinessData = { documents?: Record<string, unknown>[]; customers?: Record<string, unknown>[]; expenses?: Record<string, unknown>[]; settings?: Record<string, unknown>; updatedAt?: number };
export type DonidexWorkspace = { profile?: Record<string, unknown>; businesses?: DonidexBusiness[]; activeBusinessId?: string; documents?: Record<string, unknown>[]; customers?: Record<string, unknown>[]; expenses?: Record<string, unknown>[]; settings?: Record<string, unknown>; migratedAt?: number; updatedAt?: number };

const requireDb = () => { if (!db) throw new Error('DONIDEX data storage is not configured yet.'); return db; };
const userRef = (userId: string) => doc(requireDb(), 'users', userId);
const businessesRef = (userId: string) => collection(requireDb(), 'users', userId, 'businesses');

export async function loadWorkspace(userId: string) { const snapshot = await getDoc(userRef(userId)); return (snapshot.exists() ? snapshot.data().workspace : null) as DonidexWorkspace | null; }
export async function saveWorkspace(userId: string, workspace: DonidexWorkspace) { await setDoc(userRef(userId), { workspace: { ...workspace, updatedAt: Date.now() }, updatedAt: Date.now() }, { merge: true }); }
export async function saveBusiness(userId: string, businessId: string, data: Omit<DonidexBusiness, 'id'> | DonidexBusiness) { await setDoc(doc(businessesRef(userId), businessId), { ...data, id: businessId, updatedAt: Date.now() }, { merge: true }); }
export async function loadBusiness(userId: string, businessId: string) { const snapshot = await getDoc(doc(businessesRef(userId), businessId)); return (snapshot.exists() ? snapshot.data() : null) as DonidexBusiness | null; }
export async function loadBusinessData(userId: string, businessId: string) { const snapshot = await getDoc(doc(businessesRef(userId), businessId)); if (!snapshot.exists()) return null; const data = snapshot.data(); return (data.data || null) as DonidexBusinessData | null; }
export async function saveBusinessData(userId: string, businessId: string, data: DonidexBusinessData) { await setDoc(doc(businessesRef(userId), businessId), { data: { ...data, updatedAt: Date.now() }, updatedAt: Date.now() }, { merge: true }); }

export function workspaceFromLocalStorage(): DonidexWorkspace {
  const read = (key: string) => { try { const raw = localStorage.getItem(`donidex:${key}`); return raw ? JSON.parse(raw) : undefined; } catch { return undefined; } };
  const business = read('business') as DonidexBusiness | undefined; const businessId = business?.id || 'default-business';
  return { profile: read('profile'), businesses: business ? [{ ...business, id: businessId, archived: false }] : [{ id: businessId, name: 'My Business', archived: false, createdAt: Date.now() }], activeBusinessId: businessId, documents: read('docs') || [], customers: read('customers') || [], expenses: read('expenses') || [], settings: read('settings'), migratedAt: Date.now() };
}

export function applyWorkspaceToLocalStorage(workspace: DonidexWorkspace) {
  const write = (key: string, value: unknown) => { if (value !== undefined) localStorage.setItem(`donidex:${key}`, JSON.stringify(value)); };
  const active = workspace.businesses?.find(b => b.id === workspace.activeBusinessId) || workspace.businesses?.find(b => !b.archived) || workspace.businesses?.[0];
  write('profile', workspace.profile || {}); write('docs', workspace.documents || []); write('customers', workspace.customers || []); write('expenses', workspace.expenses || []); if (active) write('business', active); if (workspace.settings) write('settings', workspace.settings);
}
