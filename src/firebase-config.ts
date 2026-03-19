import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app: any = null;
let authInstance: any = null;
let dbInstance: any = null;

const firebaseFallbackConfig = {
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

function getFirebaseConfig() {
  return {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseFallbackConfig.apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      firebaseFallbackConfig.authDomain,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      firebaseFallbackConfig.projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      firebaseFallbackConfig.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      firebaseFallbackConfig.messagingSenderId,
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseFallbackConfig.appId,
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
      firebaseFallbackConfig.measurementId,
  };
}

export function hasFirebaseClientConfig() {
  const config = getFirebaseConfig();

  return REQUIRED_FIREBASE_CLIENT_FIELDS.every((field) => {
    const value = config[field];
    return typeof value === "string" && value.trim().length > 0;
  });
}

// Only initialize Firebase on the client side
function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error(
      "Firebase cannot be accessed on the server. Ensure you're using 'use client' components.",
    );
  }

  if (!hasFirebaseClientConfig()) {
    throw new Error(
      "Firebase client configuration is missing or invalid. Set NEXT_PUBLIC_FIREBASE_* environment variables.",
    );
  }

  if (!app) {
    app = initializeApp(getFirebaseConfig());
  }

  return app;
}

function getFirebaseAuth() {
  const firebaseApp = getFirebaseApp();
  if (!authInstance) {
    authInstance = getAuth(firebaseApp);
  }
  return authInstance;
}

function getFirebaseDb() {
  const firebaseApp = getFirebaseApp();
  if (!dbInstance) {
    dbInstance = getFirestore(firebaseApp);
  }
  return dbInstance;
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (typeof window === "undefined" || !hasFirebaseClientConfig()) {
    callback(null);
    return () => {};
  }

  try {
    return onAuthStateChanged(getFirebaseAuth(), callback);
  } catch (error) {
    console.error("Failed to initialize Firebase auth listener", error);
    callback(null);
    return () => {};
  }
}

export const auth = new Proxy({} as any, {
  get(target, prop) {
    return getFirebaseAuth()[prop as string];
  },
});

export const db = new Proxy({} as any, {
  get(target, prop) {
    return getFirebaseDb()[prop as string];
  },
});
