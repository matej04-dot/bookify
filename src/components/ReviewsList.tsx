import ReviewItem from "./ReviewItem";
import type { Review } from "../types/Types";
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
    throw new Error("Firebase Admin environment variables are not configured.");
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

interface ReviewListProps {
  bookId?: string;
}

export default async function ReviewsList({ bookId }: ReviewListProps) {
  if (!bookId) {
    return (
      <div className="text-center text-gray-500 m-2">No reviews found</div>
    );
  }

  try {
    const firebaseAdmin = getFirebaseAdmin();
    const db = firebaseAdmin.firestore();

    const normalized = bookId.replace(/^\/?works\//i, "").trim();

    const snapshot = await db
      .collection("reviews")
      .where("bookId", "==", normalized)
      .orderBy("createdAt", "desc")
      .get();

    const reviews: Review[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 max-w-2xl mx-auto">
        {reviews.length === 0 ? (
          <div className="text-center py-6">
            <svg
              className="w-10 h-10 text-gray-300 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-gray-500 text-sm">
              No reviews yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    return (
      <div className="text-red-500">
        Error loading reviews: {(err as Error).message}
      </div>
    );
  }
}
