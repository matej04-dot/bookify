import type { Firestore } from "firebase-admin/firestore";

export type UserModerationState = {
  isBanned: boolean;
  bannedReason: string | null;
};

export async function getUserModerationState(
  db: Firestore,
  userId: string,
): Promise<UserModerationState> {
  const userSnap = await db.collection("users").doc(userId).get();
  const data = userSnap.exists ? userSnap.data() || {} : {};

  const reasonRaw =
    typeof data.bannedReason === "string" ? data.bannedReason.trim() : "";

  return {
    isBanned: data.isBanned === true,
    bannedReason: reasonRaw || null,
  };
}

export async function getBanErrorMessage(
  db: Firestore,
  userId: string,
): Promise<string | null> {
  const moderation = await getUserModerationState(db, userId);
  if (!moderation.isBanned) {
    return null;
  }

  if (moderation.bannedReason) {
    return `Account suspended: ${moderation.bannedReason}`;
  }

  return "Account suspended";
}
