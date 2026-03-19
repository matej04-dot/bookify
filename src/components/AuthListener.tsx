"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase-config";
import { saveUser } from "@/services/users";
import type { User } from "@/services/users";

const AuthListener = () => {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.uid) {
        return;
      }

      try {
        const payload: User = {
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
        };

        await saveUser(payload);
      } catch {}
    });

    return () => unsub();
  }, []);

  return null;
};

export default AuthListener;
