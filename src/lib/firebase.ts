import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserRole } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId from firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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

// Mandatory startup test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or network restricted.");
    }
    return false;
  }
}

// Test connection on module load
testConnection().catch(() => {});

// Default fallback demo profiles
export const DEMO_USERS: Record<UserRole, UserProfile> = {
  inspector: {
    uid: 'demo_inspector_001',
    email: 'inspector.sharma@metrology.gov.in',
    displayName: 'Rajesh Sharma',
    role: 'inspector',
    jurisdiction: 'Zone 4 - North Metrology Division',
    badgeNumber: 'LM-INS-2024-88',
    createdAt: new Date().toISOString()
  },
  reviewer: {
    uid: 'demo_reviewer_002',
    email: 'reviewer.verma@metrology.gov.in',
    displayName: 'Pooja Verma (Controller)',
    role: 'reviewer',
    jurisdiction: 'State HQ Metrology Directorate',
    badgeNumber: 'LM-REV-2022-14',
    createdAt: new Date().toISOString()
  },
  admin: {
    uid: 'demo_admin_003',
    email: 'amritanshutiwari3005@gmail.com', // Bootstrapped admin email
    displayName: 'Amritanshu Tiwari (Admin)',
    role: 'admin',
    jurisdiction: 'Central Directorate & Governance',
    badgeNumber: 'LM-ADM-MASTER-01',
    createdAt: new Date().toISOString()
  }
};

export const GUEST_USER: UserProfile = {
  uid: 'guest_unauthenticated',
  email: '',
  displayName: 'Guest Officer (Unauthenticated)',
  role: 'inspector',
  jurisdiction: 'Public Inspection Portal',
  badgeNumber: 'LM-GUEST-00',
  createdAt: new Date().toISOString()
};

export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
}
