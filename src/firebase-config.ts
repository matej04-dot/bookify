import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app: any = null;
let authInstance: any = null;
let dbInstance: any = null;

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

// Only initialize Firebase on the client side
function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error(
      "Firebase cannot be accessed on the server. Ensure you're using 'use client' components."
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

// Lazy getters - will throw if accessed on server
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
