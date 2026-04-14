import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  onIdTokenChanged,
  onAuthStateChanged,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

type FirebaseClientState = {
  auth: Auth;
  db: ReturnType<typeof getFirestore>;
};

let firebaseState: FirebaseClientState | null = null;

function readFirebaseClientConfig(): FirebaseClientConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || "",
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || "",
  };
}

const REQUIRED_FIREBASE_CLIENT_FIELDS = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
] as const;

export function hasFirebaseClientConfig() {
  return getMissingFirebaseClientConfigFields().length === 0;
}

export function getMissingFirebaseClientConfigFields() {
  const firebaseConfig = readFirebaseClientConfig();
  return REQUIRED_FIREBASE_CLIENT_FIELDS.filter((field) => {
    const value = firebaseConfig[field];
    return !(typeof value === "string" && value.trim().length > 0);
  });
}

function getFirebaseClientState(): FirebaseClientState {
  if (firebaseState) {
    return firebaseState;
  }

  if (typeof window === "undefined") {
    throw new Error("Firebase client cannot be initialized on the server.");
  }

  if (!hasFirebaseClientConfig()) {
    throw new Error("Missing Firebase client configuration.");
  }

  const app = getApps().length
    ? getApp()
    : initializeApp(readFirebaseClientConfig());
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const auth = getAuth(app);
  const db = isLocalhost
    ? initializeFirestore(app, {
        experimentalForceLongPolling: true,
      })
    : getFirestore(app);

  firebaseState = { auth, db };
  return firebaseState;
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (typeof window === "undefined") {
    callback(null);
    return () => {};
  }

  if (!hasFirebaseClientConfig()) {
    callback(null);
    return () => {};
  }

  try {
    const { auth } = getFirebaseClientState();
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.error("Failed to initialize Firebase auth listener", error);
    callback(null);
    return () => {};
  }
}

export function subscribeToIdTokenChanges(
  callback: (user: User | null) => void,
) {
  if (typeof window === "undefined") {
    callback(null);
    return () => {};
  }

  if (!hasFirebaseClientConfig()) {
    callback(null);
    return () => {};
  }

  try {
    const { auth } = getFirebaseClientState();
    return onIdTokenChanged(auth, callback);
  } catch (error) {
    console.error("Failed to initialize Firebase token listener", error);
    callback(null);
    return () => {};
  }
}

export function getClientAuth() {
  return getFirebaseClientState().auth;
}

export function getClientDb() {
  return getFirebaseClientState().db;
}

export async function logoutCurrentUser() {
  if (typeof window === "undefined") {
    return;
  }

  if (!hasFirebaseClientConfig()) {
    return;
  }

  await signOut(getFirebaseClientState().auth);
  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  }).catch(() => null);
}
