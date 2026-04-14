import admin from "firebase-admin";

export function getFirebaseAdmin() {
  if (admin.apps.length) {
    return admin;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!privateKey || !projectId || !clientEmail) {
    throw new Error(
      "Firebase Admin environment variables are not configured. " +
        "Please set FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID, and FIREBASE_CLIENT_EMAIL."
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });

  return admin;
}

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice("Bearer ".length).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  // Fallback headers for environments where Authorization can be stripped.
  const fallbackHeader =
    request.headers.get("x-firebase-auth") ||
    request.headers.get("x-admin-token") ||
    "";

  if (!fallbackHeader) {
    return null;
  }

  if (fallbackHeader.startsWith("Bearer ")) {
    const fallbackBearerToken = fallbackHeader
      .slice("Bearer ".length)
      .trim();
    return fallbackBearerToken.length > 0 ? fallbackBearerToken : null;
  }

  const rawToken = fallbackHeader.trim();
  return rawToken.length > 0 ? rawToken : null;
}
