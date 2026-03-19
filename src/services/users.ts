import { db } from "../firebase-config";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export interface User {
  uid: string;
  // email može biti null (npr. Google account without email) ili neprisutno
  email?: string | null;
  displayName?: string | null;
  role?: "user" | "admin";
  createdAt?: any;
  lastLogin?: any;
}

export async function saveUser(user: User) {
  if (!user?.uid) throw new Error("saveUser: missing uid");
  const userRef = doc(db, "users", user.uid);

  try {
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      let roleToSet = user.role || "user";

      if (user.email) {
        try {
          const q = query(
            collection(db, "users"),
            where("email", "==", user.email),
          );
          const found = await getDocs(q);
          if (!found.empty) {
            const existing = found.docs[0].data();
            if (existing && existing.role) roleToSet = existing.role;
          }
        } catch {}
      }

      const data: any = {
        uid: user.uid,
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        role: roleToSet,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      try {
        await setDoc(userRef, data, { merge: true });
      } catch (err) {
        throw err;
      }
      return;
    }

    const existing = snap.data() || {};
    const data: any = {
      email: user.email ?? existing.email ?? null,
      displayName: user.displayName ?? existing.displayName ?? null,
      lastLogin: serverTimestamp(),
    };
    await setDoc(userRef, data, { merge: true });
  } catch (err: any) {
    throw err;
  }
}

export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
