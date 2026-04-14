"use client";
import { useEffect, useRef, useState } from "react";
import ReviewComponent from "./ReviewComponent";
import {
  getClientAuth,
  hasFirebaseClientConfig,
  subscribeToAuthChanges,
} from "../firebase-config";
import {
  addWishlistItem,
  isBookInWishlist,
  removeWishlistItem,
} from "../services/wishlist";

export default function BookDetailsClient({
  bookKey,
  bookName,
  authors = [],
  coverEditionKey = null,
}: {
  bookKey: string;
  bookName?: string;
  authors?: string[];
  coverEditionKey?: string | null;
}) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wishlistReady, setWishlistReady] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const wishlistOperationIdRef = useRef(0);

  const normalizedBookID = bookKey.replace(/^\/?works\//i, "").trim();

  useEffect(() => {
    let active = true;

    if (!hasFirebaseClientConfig()) {
      setIsAuthenticated(false);
      setInWishlist(false);
      setWishlistReady(true);
      return;
    }

    const unsub = subscribeToAuthChanges(async (user) => {
      const operationId = ++wishlistOperationIdRef.current;

      if (!active) {
        return;
      }

      const signedIn = Boolean(user);
      setIsAuthenticated(signedIn);

      if (!signedIn) {
        setInWishlist(false);
        setWishlistReady(true);
        return;
      }

      setWishlistReady(false);
      try {
        const status = await isBookInWishlist(normalizedBookID);
        if (active && operationId === wishlistOperationIdRef.current) {
          setInWishlist(status);
        }
      } catch {
        if (active && operationId === wishlistOperationIdRef.current) {
          setInWishlist(false);
        }
      } finally {
        if (active && operationId === wishlistOperationIdRef.current) {
          setWishlistReady(true);
        }
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [normalizedBookID]);

  const toggleWishlist = async () => {
    if (!hasFirebaseClientConfig()) {
      alert("Wishlist is unavailable. Missing Firebase client configuration.");
      return;
    }

    if (!isAuthenticated) {
      alert("You must be logged in or registered to use wishlist.");
      return;
    }

    if (!normalizedBookID) {
      alert("Invalid book id.");
      return;
    }

    try {
      ++wishlistOperationIdRef.current;
      setWishlistLoading(true);

      if (inWishlist) {
        await removeWishlistItem(normalizedBookID);
        setInWishlist(false);
        return;
      }

      await addWishlistItem({
        bookID: normalizedBookID,
        bookName: (bookName ?? "Unknown book").trim() || "Unknown book",
        authors: authors.filter(Boolean),
        coverEditionKey,
      });

      setInWishlist(true);
    } catch {
      alert("Failed to update wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 sm:w-auto"
          onClick={() => {
            if (!hasFirebaseClientConfig()) {
              alert(
                "Review submission is unavailable. Missing Firebase client configuration.",
              );
              return;
            }

            const auth = getClientAuth();
            const canReview = !!auth.currentUser;
            if (canReview) {
              setShowReviewModal(true);
            } else {
              alert("You must be logged in or registered to leave a review.");
            }
          }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Write a Review
        </button>

        <button
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto ${
            inWishlist
              ? "border-amber-300/70 bg-amber-50 text-amber-800 hover:bg-amber-100 focus:ring-amber-300/60"
              : "border-sky-300/70 bg-sky-50 text-sky-800 hover:bg-sky-100 focus:ring-sky-300/60"
          }`}
          onClick={toggleWishlist}
          disabled={wishlistLoading || (!wishlistReady && isAuthenticated)}
        >
          <svg
            className="w-5 h-5"
            fill={inWishlist ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a3 3 0 00-3 3v11a1 1 0 001.447.894L12 16l8.553 3.894A1 1 0 0022 19V8a3 3 0 00-3-3H5z"
            />
          </svg>
          {wishlistLoading
            ? "Saving..."
            : !wishlistReady && isAuthenticated
              ? "Checking..."
              : inWishlist
                ? "Remove from Wishlist"
                : "Add to Wishlist"}
        </button>
      </div>
      {showReviewModal && (
        <ReviewComponent
          onClose={() => setShowReviewModal(false)}
          bookName={bookName}
          bookId={bookKey}
        />
      )}
    </>
  );
}
