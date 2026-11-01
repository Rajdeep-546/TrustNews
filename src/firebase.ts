import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload,
  updateProfile,
  signOut,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { resolveUserAvatarUrl } from './utils/avatar';

// Silence internal @firebase/firestore console.error noise so transient token/network retries never trigger error overlays
setLogLevel('silent');

// Purge any stale IndexedDB token from previous sessions that could trigger securetoken.googleapis.com refresh errors
if (typeof window !== 'undefined' && window.indexedDB) {
  try {
    window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
  } catch {
    // Ignore IndexedDB cleanup errors
  }
}

// Primary app exclusively for Cloud Firestore so Firestore never blocks on securetoken.googleapis.com
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Dedicated app for Authentication with in-memory persistence so expired IndexedDB tokens never call securetoken.googleapis.com
const authApp = initializeApp(firebaseConfig, 'trustnews-auth');
export const auth = initializeAuth(authApp, {
  persistence: inMemoryPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});
export const googleProvider = new GoogleAuthProvider();

const SESSION_STORAGE_KEY = 'trustnews_session_user_v1';
const VERIFIED_EMAILS_STORAGE_KEY = 'trustnews_verified_emails_v1';
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface CachedAuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface OtpDispatchResponse {
  success: boolean;
  email: string;
  expiresInSeconds: number;
  emailDispatched: boolean;
}

let latestAuthIdToken = '';
let latestCleanDisplayName = '';

function stripOtpSuffix(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/\s*\((?:Your\s+)?6-Digit\s+OTP:\s*\d+\)/gi, '').trim();
}

export function isValidEmailAddress(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!STRICT_EMAIL_REGEX.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (!domain || domain.startsWith('-') || domain.endsWith('-') || domain.includes('..')) return false;
  const domainLabels = domain.split('.');
  if (domainLabels.some((label) => label.length === 0)) return false;
  const tld = domainLabels[domainLabels.length - 1];
  if (!tld || tld.length < 2) return false;
  return true;
}

export function isEmailMarkedVerified(email: string | null | undefined): boolean {
  if (!email || typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(VERIFIED_EMAILS_STORAGE_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw) as string[];
    return Array.isArray(list) && list.includes(email.trim().toLowerCase());
  } catch {
    return false;
  }
}

export function markEmailAsVerified(email: string | null | undefined): void {
  if (!email || typeof window === 'undefined') return;
  const clean = email.trim().toLowerCase();
  try {
    const raw = window.localStorage.getItem(VERIFIED_EMAILS_STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(clean)) {
      list.push(clean);
      window.localStorage.setItem(VERIFIED_EMAILS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage errors
  }
}

export function formatFirebaseAuthError(error: any): string {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-login-credentials' ||
    message.includes('invalid-credential') ||
    message.includes('wrong-password') ||
    message.includes('invalid-login-credentials')
  ) {
    return 'Incorrect email or password. Please verify your credentials or sign up if you do not have an account.';
  }
  if (code === 'auth/user-not-found' || message.includes('user-not-found')) {
    return 'No account found with this email address. Please sign up to create an account first.';
  }
  if (code === 'auth/invalid-email' || message.includes('invalid-email')) {
    return 'Please enter a valid email address (e.g., name@domain.com).';
  }
  if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
    return 'This email address is already registered. Please sign in with your password instead.';
  }
  if (code === 'auth/weak-password' || message.includes('weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/too-many-requests' || message.includes('too-many-requests')) {
    return 'Too many failed authentication attempts. Please wait a moment and try again.';
  }
  if (code === 'auth/user-disabled' || message.includes('user-disabled')) {
    return 'This user account has been disabled.';
  }
  if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
    return 'Email/Password sign-in is not enabled in the Firebase console for this project.';
  }
  if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
    return 'Network error while connecting to Firebase Authentication. Please check your connection.';
  }
  if (error instanceof Error && error.message) {
    return error.message.replace(/^Firebase:\s*/i, '');
  }
  return 'Authentication failed. Please check your email and password and try again.';
}

export function getCachedAuthUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAuthUser;
    if (
      !parsed ||
      !parsed.uid ||
      !parsed.emailVerified ||
      parsed.uid === 'analyst_verified_session' ||
      parsed.uid.startsWith('user_')
    ) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    const cleanName = stripOtpSuffix(parsed.displayName) || parsed.email?.split('@')[0] || 'User';
    const hydrated: CachedAuthUser = {
      ...parsed,
      displayName: cleanName,
      photoURL: resolveUserAvatarUrl(parsed.photoURL, cleanName, parsed.uid || parsed.email),
    };
    return hydrated as unknown as User;
  } catch {
    return null;
  }
}

export function setCachedAuthUser(user: CachedAuthUser): User {
  const cleanName = stripOtpSuffix(user.displayName) || user.email?.split('@')[0] || 'User';
  const normalized: CachedAuthUser = {
    ...user,
    displayName: cleanName,
    photoURL: resolveUserAvatarUrl(user.photoURL, cleanName, user.uid || user.email),
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore storage quota errors
    }
  }
  return normalized as unknown as User;
}

export function clearCachedAuthUser(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    if (u.email) {
      markEmailAsVerified(u.email);
    }
    const cleanName = stripOtpSuffix(u.displayName) || 'News Researcher';
    return setCachedAuthUser({
      uid: u.uid,
      displayName: cleanName,
      email: u.email || '',
      photoURL: resolveUserAvatarUrl(u.photoURL, cleanName, u.uid || u.email),
      emailVerified: true,
    });
  } catch (error: any) {
    console.warn('Google sign-in error:', error);
    throw new Error(formatFirebaseAuthError(error));
  }
}

export interface EmailAuthResult {
  user: User;
  requiresOtpVerification: boolean;
  otpDispatch?: OtpDispatchResponse;
}

export async function requestEmailOtp(
  email: string,
  idTokenOverride?: string,
  displayNameOverride?: string
): Promise<OtpDispatchResponse> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmailAddress(cleanEmail)) {
    throw new Error('Please enter a valid email address (e.g., name@domain.com).');
  }

  const activeIdToken =
    idTokenOverride ||
    latestAuthIdToken ||
    (auth.currentUser as any)?.stsTokenManager?.accessToken ||
    '';

  const activeDisplayName =
    displayNameOverride ||
    latestCleanDisplayName ||
    stripOtpSuffix(auth.currentUser?.displayName) ||
    cleanEmail.split('@')[0];

  const resp = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      idToken: activeIdToken,
      displayName: activeDisplayName,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error || 'Failed to send verification email.');
  }

  return data;
}

export async function verifyEmailOtpCode(email: string, code: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const resp = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
  });

  const data = await resp.json();
  if (!resp.ok || !data?.verified) {
    throw new Error(data?.error || 'Invalid OTP verification code.');
  }

  markEmailAsVerified(cleanEmail);
  return true;
}

export async function checkFirebaseEmailLinkVerified(email?: string): Promise<boolean> {
  const activeIdToken =
    latestAuthIdToken || (auth.currentUser as any)?.stsTokenManager?.accessToken || '';

  if (activeIdToken) {
    try {
      const resp = await fetch('/api/auth/check-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: activeIdToken,
          email: email || auth.currentUser?.email || '',
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.verified) {
        if (data.email) {
          markEmailAsVerified(data.email);
        }
        return true;
      }
    } catch (err) {
      console.warn('Error checking server email verification:', err);
    }
  }

  if (!auth.currentUser) return false;
  try {
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      if (auth.currentUser.email) {
        markEmailAsVerified(auth.currentUser.email);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<EmailAuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmailAddress(cleanEmail)) {
    throw new Error('Please enter a valid email address (e.g., name@domain.com).');
  }
  if (!password || password.length < 6) {
    throw new Error('Incorrect email or password. Passwords must be at least 6 characters.');
  }

  const inferredName = cleanEmail
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  try {
    const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const u = result.user;
    const rawIdToken =
      (result as any)?._tokenResponse?.idToken ||
      (u as any)?.stsTokenManager?.accessToken ||
      '';
    const cleanName = stripOtpSuffix(u.displayName) || inferredName || 'News Researcher';

    latestAuthIdToken = rawIdToken;
    latestCleanDisplayName = cleanName;

    // If the user already clicked the Firebase verification link on their account, complete sign-in;
    // otherwise send the 6-digit OTP verification email to their inbox
    if (u.emailVerified) {
      markEmailAsVerified(cleanEmail);
      const verifiedUser = setCachedAuthUser({
        uid: u.uid,
        displayName: cleanName,
        email: u.email || cleanEmail,
        photoURL: u.photoURL || null,
        emailVerified: true,
      });
      return {
        user: verifiedUser,
        requiresOtpVerification: false,
      };
    }

    const otpDispatch = await requestEmailOtp(cleanEmail, rawIdToken, cleanName);

    const pendingUser: CachedAuthUser = {
      uid: u.uid,
      displayName: cleanName,
      email: u.email || cleanEmail,
      photoURL: resolveUserAvatarUrl(u.photoURL, cleanName, u.uid || cleanEmail),
      emailVerified: false,
    };

    return {
      user: pendingUser as unknown as User,
      requiresOtpVerification: true,
      otpDispatch,
    };
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<EmailAuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = stripOtpSuffix(name.trim());

  if (!cleanName || cleanName.length < 2) {
    throw new Error('Please enter your full name (at least 2 characters).');
  }
  if (!isValidEmailAddress(cleanEmail)) {
    throw new Error('Please enter a valid email address (e.g., name@domain.com).');
  }
  if (!password || password.length < 6) {
    throw new Error('Password is too weak. Please use at least 6 characters.');
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const u = result.user;
    const rawIdToken =
      (result as any)?._tokenResponse?.idToken ||
      (u as any)?.stsTokenManager?.accessToken ||
      '';

    latestAuthIdToken = rawIdToken;
    latestCleanDisplayName = cleanName;

    // Dispatch verification email containing the 6-digit OTP to the user's email inbox
    const otpDispatch = await requestEmailOtp(cleanEmail, rawIdToken, cleanName);

    const pendingUser: CachedAuthUser = {
      uid: u.uid,
      displayName: cleanName,
      email: u.email || cleanEmail,
      photoURL: resolveUserAvatarUrl(u.photoURL, cleanName, u.uid || cleanEmail),
      emailVerified: false,
    };

    return {
      user: pendingUser as unknown as User,
      requiresOtpVerification: true,
      otpDispatch,
    };
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

export async function logoutUser() {
  clearCachedAuthUser();
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Sign out warning:', error);
  }
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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const cachedUser = getCachedAuthUser();
  const activeUser = auth.currentUser || cachedUser;
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: activeUser?.uid,
      email: activeUser?.email,
      emailVerified: activeUser?.emailVerified,
      isAnonymous: false,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };

  if (
    errMsg.toLowerCase().includes('client is offline') ||
    errMsg.toLowerCase().includes('token-service') ||
    errMsg.toLowerCase().includes('securetoken') ||
    errMsg.toLowerCase().includes('network-request-failed') ||
    errMsg.toLowerCase().includes('unavailable')
  ) {
    console.warn(`Firestore operating in offline/degraded mode for path [${path}]:`, errMsg);
    return;
  }

  console.warn('Firestore operation notice:', JSON.stringify(errInfo));
}

// Initial connection test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection is initializing in offline mode.');
    }
  }
}

testConnection();
