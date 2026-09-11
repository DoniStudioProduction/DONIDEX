import { GoogleAuthProvider, OAuthProvider, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, appleProvider, firebaseConfigured, googleProvider } from './firebase';

const requireAuth = () => { if (!firebaseConfigured || !auth) throw new Error('DONIDEX authentication is not configured yet.'); return auth; };
export const signInEmail = (email: string, password: string) => signInWithEmailAndPassword(requireAuth(), email, password);
export const createEmailAccount = async (email: string, password: string) => { const credential = await createUserWithEmailAndPassword(requireAuth(), email, password); await sendEmailVerification(credential.user); return credential; };
export const signInGoogle = () => signInWithPopup(requireAuth(), new GoogleAuthProvider());
export const signInApple = () => signInWithPopup(requireAuth(), new OAuthProvider('apple.com'));
export const signOutDoni = () => signOut(requireAuth());
