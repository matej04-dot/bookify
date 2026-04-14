import { NextResponse } from "next/server";
import { getBearerToken, getFirebaseAdmin } from "@/lib/firebase-admin";
import { isValidBookId, normalizeBookId } from "@/lib/ids";
import { limitByIp } from "@/lib/rate-limit";
import { getBanErrorMessage } from "@/lib/user-moderation";

export const runtime = "nodejs";

type WishlistDoc = {
  id: string;
  addedAt?: {
    toDate?: () => Date;
  };
  [key: string]: unknown;
};

const normalizeText = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
};

const normalizeAuthors = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((author) => (typeof author === "string" ? author.trim() : ""))
    .filter(Boolean)
    .slice(0, 12)
    .map((author) => author.slice(0, 120));
};

export async function GET(request: Request) {
  try {
    const rateLimit = await limitByIp(request, "wishlist-list", 90, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const firebaseAdmin = getFirebaseAdmin();
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Missing bearer token" },
        { status: 401 },
      );
    }

    const idToken = await firebaseAdmin.auth().verifyIdToken(token);
    const userID = idToken.uid;

    const db = firebaseAdmin.firestore();
    const snapshot = await db
      .collection("wishlist")
      .where("userID", "==", userID)
      .get();

    const data: WishlistDoc[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));

    data.sort((a, b) => {
      const aMs = a.addedAt?.toDate ? a.addedAt.toDate().getTime() : 0;
      const bMs = b.addedAt?.toDate ? b.addedAt.toDate().getTime() : 0;
      return bMs - aMs;
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const rateLimit = await limitByIp(request, "wishlist-add", 40, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const firebaseAdmin = getFirebaseAdmin();
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Missing bearer token" },
        { status: 401 },
      );
    }

    const idToken = await firebaseAdmin.auth().verifyIdToken(token);
    const userID = idToken.uid;
    const db = firebaseAdmin.firestore();
    const banMessage = await getBanErrorMessage(db, userID);

    if (banMessage) {
      return NextResponse.json({ error: banMessage }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

    const rawBookID = typeof body?.bookID === "string" ? body.bookID : "";
    const bookID = normalizeBookId(rawBookID);

    if (!isValidBookId(bookID)) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    const bookName = normalizeText(body?.bookName, 255);
    if (!bookName) {
      return NextResponse.json({ error: "Invalid book name" }, { status: 400 });
    }

    const authors = normalizeAuthors(body?.authors);
    const coverEditionKeyRaw = normalizeText(body?.coverEditionKey, 128);
    const coverEditionKey = coverEditionKeyRaw || null;

    const wishlistId = `${userID}_${bookID}`;
    const wishlistRef = db.collection("wishlist").doc(wishlistId);
    const existing = await wishlistRef.get();

    if (existing.exists) {
      return NextResponse.json({ added: false, exists: true, id: wishlistId });
    }

    await wishlistRef.set({
      userID,
      bookID,
      bookName,
      authors,
      coverEditionKey,
      addedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ added: true, exists: false, id: wishlistId });
  } catch {
    return NextResponse.json(
      { error: "Failed to add wishlist item" },
      { status: 500 },
    );
  }
}
