import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Firebase Admin only when needed (not at build time)
function getFirebaseAdmin() {
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

export async function GET(request: Request) {
  try {
    const firebaseAdmin = getFirebaseAdmin();

    const url = new URL(request.url);
    const bookId = url.pathname.split("/").pop() || "";

    const normalized = decodeURIComponent(bookId)
      .replace(/^\/?works\//i, "")
      .trim();

    const db = firebaseAdmin.firestore();
    const snapshot = await db
      .collection("reviews")
      .where("bookId", "==", normalized)
      .orderBy("createdAt", "desc")
      .get();

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
