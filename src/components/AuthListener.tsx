"use client";
import { useEffect } from "react";
import { subscribeToAuthChanges } from "@/firebase-config";
import { saveUser } from "@/services/users";
import type { User } from "@/services/users";

const AuthListener = () => {
  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (user) => {
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
