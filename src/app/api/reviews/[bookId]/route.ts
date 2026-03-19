import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const firebaseAdmin = getFirebaseAdmin();

    const url = new URL(request.url);
    const bookId = url.pathname.split("/").pop() || "";

    const normalized = decodeURIComponent(bookId)
      .replace(/^\/?works\//i, "")
      .trim();

    if (
      !normalized ||
      normalized.length > 128 ||
      /[^a-zA-Z0-9_-]/.test(normalized)
    ) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

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
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
