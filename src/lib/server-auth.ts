import { cookies } from "next/headers";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export const SESSION_COOKIE_NAME = "bookify_session";

export type ServerViewer = {
  uid: string;
  role: string;
  email: string | null;
  isBanned: boolean;
  bannedReason: string | null;
};

export async function getServerViewer(): Promise<ServerViewer | null> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(SESSION_COOKIE_NAME)?.value?.trim() || "";

  if (!sessionToken) {
    return null;
  }

  try {
    const firebaseAdmin = getFirebaseAdmin();
    const idToken = await firebaseAdmin.auth().verifyIdToken(sessionToken);
    const userSnap = await firebaseAdmin
      .firestore()
      .collection("users")
      .doc(idToken.uid)
      .get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};

    const roleRaw = userData.role;
    const role =
      typeof roleRaw === "string" && roleRaw.trim() ? roleRaw : "user";
    const bannedReasonRaw =
      typeof userData.bannedReason === "string"
        ? userData.bannedReason.trim()
        : "";

    return {
      uid: idToken.uid,
      role,
      email: idToken.email ?? null,
      isBanned: userData.isBanned === true,
      bannedReason: bannedReasonRaw || null,
    };
  } catch {
    return null;
  }
}
