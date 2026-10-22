/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Account, PatientData, ChronosData } from './types';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
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
  const path = `patientData/${patientId}`;
  try {
    const payload = {
      ...pData,
      patientId,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'patientData', patientId), payload, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Could not sync patientData to cloud:`, err);
    return false;
  }
}

// Sync account profile to Firestore
export async function syncAccountToCloud(account: Account): Promise<boolean> {
  const path = `accounts/${account.id}`;
  try {
    const payload = {
      ...account,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'accounts', account.id), payload, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Could not sync account to cloud:`, err);
    return false;
  }
}

// Fetch remote patient dataset if available
export async function fetchPatientDataFromCloud(patientId: string): Promise<PatientData | null> {
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
