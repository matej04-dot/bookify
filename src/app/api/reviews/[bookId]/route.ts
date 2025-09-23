import { NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export async function GET(
  request: Request,
  { params }: { params: { bookId: string } }
) {
  const { bookId } = params;

  const normalized = decodeURIComponent(bookId)
    .replace(/^\/?works\//i, "")
    .trim();

  const db = admin.firestore();
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
}
