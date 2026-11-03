/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDocFromServer,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Account, PatientData, LinkRecord } from './types';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

function removeUndefined(value: any): any {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, removeUndefined(item)]));
  }
  return value;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore: client is offline or network restricted.');
    }
    return false;
  }
}

// Google Sign In
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (err) {
    console.error('Google Sign In Error:', err);
    throw err;
  }
}

export async function logOutFromFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.error('Firebase Logout Error:', err);
  }
}

// Sync specific patient dataset to Firestore
export async function syncPatientDataToCloud(patientId: string, pData: PatientData): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== patientId) return false;
  try {
    const { clinicalPhotos: storedPhotos, ...rest } = pData;
    const clinicalPhotos = storedPhotos?.map(({ thumbnailDataUrl: _legacyThumbnail, ...photo }) => photo);
    const payload = {
      ...rest,
      ...(clinicalPhotos ? { clinicalPhotos } : {}),
      patientId,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'patientData', patientId), removeUndefined(payload), { merge: true });
    return true;
  } catch (err) {
    console.warn(`Could not sync patientData to cloud:`, err);
    return false;
  }
}

// Sync account profile to Firestore
export async function syncAccountToCloud(account: Account): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== account.id) return false;
  try {
    const payload = {
      ...account,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'accounts', account.id), removeUndefined(payload), { merge: true });
    return true;
  } catch (err) {
    console.warn(`Could not sync account to cloud:`, err);
    return false;
  }
}

export async function syncLinkToCloud(link: LinkRecord): Promise<boolean> {
  const userId = auth.currentUser?.uid;
  if (!userId || (userId !== link.patientId && userId !== link.doctorId)) return false;
  try {
    await setDoc(doc(db, 'links', `${link.patientId}_${link.doctorId}`), link, { merge: true });
    return true;
  } catch {
    console.warn('Could not sync care link to cloud.');
    return false;
  }
}

export async function deleteLinkFromCloud(patientId: string, doctorId: string): Promise<boolean> {
  const userId = auth.currentUser?.uid;
  if (!userId || (userId !== patientId && userId !== doctorId)) return false;
  try {
    await deleteDoc(doc(db, 'links', `${patientId}_${doctorId}`));
    return true;
  } catch {
    console.warn('Could not remove care link from cloud.');
    return false;
  }
}

export async function fetchLinksForUser(userId: string): Promise<LinkRecord[]> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return [];
  try {
    const [asPatient, asDoctor] = await Promise.all([
      getDocs(query(collection(db, 'links'), where('patientId', '==', userId))),
      getDocs(query(collection(db, 'links'), where('doctorId', '==', userId)))
    ]);
    const records = [...asPatient.docs, ...asDoctor.docs];
    return Array.from(new Map(records.map((snapshot) => [snapshot.id, snapshot.data() as LinkRecord] as const)).values());
  } catch {
    console.warn('Could not fetch care links from cloud.');
    return [];
  }
}

// Fetch remote patient dataset if available
export async function fetchPatientDataFromCloud(patientId: string): Promise<PatientData | null> {
  if (!auth.currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'patientData', patientId));
    if (snap.exists()) {
      return snap.data() as PatientData;
    }
    return null;
  } catch (err) {
    console.warn(`Could not fetch cloud data for ${patientId}:`, err);
    return null;
  }
}

export async function fetchAccountFromCloud(userId: string): Promise<Account | null> {
  if (!auth.currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'accounts', userId));
    return snap.exists() ? snap.data() as Account : null;
  } catch (err) {
    console.warn('Could not fetch signed-in account from cloud.');
    return null;
  }
}

export async function fetchDoctorProfilesForAdmin(): Promise<Account[]> {
  if (!auth.currentUser) throw new Error('Faça login para continuar.');
  const token = await auth.currentUser.getIdTokenResult();
  if (token.claims.admin !== true) throw new Error('Acesso restrito à administração.');
  const result = await getDocs(query(collection(db, 'accounts'), where('role', '==', 'doctor')));
  return result.docs.map((item) => item.data() as Account);
}

export async function fetchProfessionalReviewsForAdmin(): Promise<Array<Record<string, unknown>>> {
  if (!auth.currentUser) throw new Error('Faça login para continuar.');
  const token = await auth.currentUser.getIdTokenResult();
  if (token.claims.admin !== true) throw new Error('Acesso restrito à administração.');
  const result = await getDocs(query(collection(db, 'professionalReviews')));
  return result.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function reviewDoctorProfile(account: Account, decision: 'verified' | 'failed', reason = ''): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Faça login para continuar.');
  const token = await user.getIdTokenResult();
  if (token.claims.admin !== true) throw new Error('Acesso restrito à administração.');
  const approved = decision === 'verified';
  const batch = writeBatch(db);
  batch.update(doc(db, 'accounts', account.id), {
    'crm.status': decision,
    'crm.verified': approved,
    'crm.rejectionReason': approved ? '' : reason.trim(),
    'crm.verifiedAt': approved ? new Date().toISOString() : null
  });
  batch.set(doc(collection(db, 'professionalReviews')), {
    professionalId: account.id,
    professionalEmail: account.email,
    decision,
    reason: reason.trim(),
    reviewerUid: user.uid,
    createdAt: serverTimestamp()
  });
  await batch.commit();
}
