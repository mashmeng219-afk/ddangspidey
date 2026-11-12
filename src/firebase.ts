import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass the firestoreDatabaseId from firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const OWNER_EMAILS = [
  'choehyejeong219@gmail.com',
  'jennyjelly607@gmail.com',
];

export const OWNER_WHITELIST_EMAIL = OWNER_EMAILS[0];

export function checkIsOwner(email?: string | null): boolean {
  if (!email) return false;
  return OWNER_EMAILS.some((ownerEmail) => ownerEmail.toLowerCase() === email.toLowerCase());
}

export function formatKoreanError(err: unknown): string {
  if (!err) return '오류가 발생했습니다.';
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('unauthorized') ||
    msg.includes('권한')
  ) {
    return '삭제 또는 수정 권한이 없습니다. 관리자(주인) 계정으로 로그인되어 있는지 확인해주세요.';
  }
  if (
    msg.includes('unavailable') ||
    msg.includes('offline') ||
    msg.includes('network') ||
    msg.includes('Failed to fetch')
  ) {
    return '네트워크 연결이 끊겼거나 원활하지 않습니다. 인터넷 연결 상태를 확인 후 다시 시도해주세요.';
  }
  return `처리 중 오류가 발생했습니다: ${msg}`;
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
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
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
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
  }
}
testConnection();
