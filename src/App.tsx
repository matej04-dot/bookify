import "./App.css";
import router from "./routes/routes";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase-config";
import { saveUser } from "./services/users";
import type { User } from "./services/users";

function App() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged:", {
        uid: user?.uid,
        projectId: auth.app?.options?.projectId,
        providerData: user?.providerData,
      });

      if (!user || !user.uid) {
        console.log("No authenticated user yet.");
        return;
      }

      try {
        try {
          const token = await auth.currentUser?.getIdToken(false);
          console.log("idToken present:", !!token);
        } catch (tErr) {
          console.warn("Could not get idToken (ignored):", tErr);
        }

        const payload: User = {
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
        };

        console.log("saveUser payload:", payload);

        try {
          await saveUser(payload);
          console.log("saveUser OK");
        } catch (saveErr: any) {
          console.error(
            "saveUser failed:",
            saveErr?.code ?? saveErr?.name ?? saveErr,
            saveErr?.message ?? saveErr
          );
        }
      } catch (e: any) {
        console.error(
          "Unexpected error in onAuthStateChanged handler:",
          e?.code ?? e?.name ?? e,
          e?.message ?? e
        );
      }
    });

    return () => unsub();
  }, []);

  return (
    <>
      <router.RouterProvider router={router.router} />
    </>
  );
}

export default App;
