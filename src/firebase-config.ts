import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCeRqrD_ohr7Bze8Wl7oU_RQUbcbN-fxs",
  authDomain: "bookify-79744.firebaseapp.com",
  projectId: "bookify-79744",
  storageBucket: "bookify-79744.firebasestorage.app",
  messagingSenderId: "895999662926",
  appId: "1:895999662926:web:7b2ac2eece6164bf415c1f",
  measurementId: "G-NH7M9RGXBX",
} as const;

const REQUIRED_FIREBASE_CLIENT_FIELDS = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
] as const;

export function hasFirebaseClientConfig() {
  return REQUIRED_FIREBASE_CLIENT_FIELDS.every((field) => {
    const value = firebaseConfig[field];
    return typeof value === "string" && value.trim().length > 0;
  });
}

const app = initializeApp(firebaseConfig);
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const auth = getAuth(app);
const db = isLocalhost
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
    })
  : getFirestore(app);

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (typeof window === "undefined") {
    callback(null);
    return () => {};
  }

  try {
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.error("Failed to initialize Firebase auth listener", error);
    callback(null);
    return () => {};
  }
}

export function getClientAuth() {
  return auth;
}

export function getClientDb() {
  return db;
}

export async function logoutCurrentUser() {
  if (typeof window === "undefined") {
    return;
  }

  await signOut(auth);
}

export { auth, db };
