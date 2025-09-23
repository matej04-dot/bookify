import { NextResponse } from "next/server";
import admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (!privateKey) {
  throw new Error("FIREBASE_PRIVATE_KEY is not set in environment variables.");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookId = url.pathname.split("/").pop() || "";

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
