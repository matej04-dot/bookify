"use client";
import { useEffect } from "react";
import { subscribeToIdTokenChanges } from "@/firebase-config";
import { saveUser } from "@/services/users";
import type { User } from "@/services/users";

async function syncServerSession(idToken: string | null) {
  if (!idToken) {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    }).catch(() => null);
    return;
  }

  await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  }).catch(() => null);
}

const AuthListener = () => {
  useEffect(() => {
    let active = true;

    try {
      const unsub = subscribeToIdTokenChanges(async (user) => {
        if (!active) {
          return;
        }

        const idToken = user ? await user.getIdToken().catch(() => null) : null;
        await syncServerSession(idToken);

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

      return () => {
        active = false;
        unsub();
      };
    } catch {
      return () => {};
    }
  }, []);

  return null;
};

export default AuthListener;
