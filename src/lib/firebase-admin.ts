import admin from "firebase-admin";

// Singleton pattern - Initialize Firebase Admin only once
function getFirebaseAdmin() {
  if (admin.apps.length) {
    return admin;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!privateKey || !projectId || !clientEmail) {
    console.error("Firebase Admin environment variables missing:", {
      hasPrivateKey: !!privateKey,
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
    });
    throw new Error(
      "Firebase Admin environment variables are not configured. " +
        "Please set FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID, and FIREBASE_CLIENT_EMAIL."
    );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }

  return admin;
}

export { getFirebaseAdmin };
export default admin;
