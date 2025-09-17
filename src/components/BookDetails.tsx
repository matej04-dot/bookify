"use client";

import { useEffect, useState } from "react";
import type { AuthorDetailsProps } from "@/types/Types";
import { imagesBaseUrl } from "@/utils/Constants";
import ReviewComponent from "./ReviewComponent";
import StarRating from "./Rating";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import ReviewsList from "./ReviewsList";

type BookDetailsProps = {
  bookKey: string;
  bookData: {
    covers?: number[];
    title?: string;
    description?: string | { value: string };
    authors?: { author: { key: string } }[];
  } | null;
  authors: AuthorDetailsProps[];
};

function BookDetails({ bookKey, bookData, authors }: BookDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [average, setAverage] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchAvg = async () => {
      if (!bookKey) {
        if (mounted) setAverage(null);
        return;
      }
      try {
        const ref = doc(db, "bookAvgRating", bookKey);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (!snap.exists()) {
          setAverage(null);
        } else {
          const data: any = snap.data();
          const total = Number(data.total ?? 0);
          const count = Number(data.count ?? 0);
          const avg = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
          setAverage(avg);
        }
      } catch (err) {
        console.error("Failed to fetch average rating:", err);
        if (mounted) setAverage(null);
      }
    };
    fetchAvg();
    return () => {
      mounted = false;
    };
  }, [bookKey]);

  const coverId = bookData?.covers?.[0];
  const bookCover = coverId
    ? `${imagesBaseUrl}/b/id/${coverId}-M.jpg`
    : undefined;

  if (!bookData) return <div>No book data found</div>;

  return (
    <>
      <div className="md:flex sm:w-full items-center justify-center md:mt-10 p-5 lg:w-4/5 lg:mx-auto">
        <div className="sm:w-1/2 md:w-1/3 flex items-center justify-center border-2 border-yellow-400 bg-gray-200 rounded-lg shadow-lg relative p-3 transition-transform transform hover:scale-105">
          {loading && (
            <div className="h-64 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {bookCover && (
            <img
              src={bookCover}
              className={`h-full object-cover ${loading ? "hidden" : "block"}`}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
              alt={bookData.title}
            />
          )}
        </div>
        <div className="md:w-3/4 md:pl-6 mt-3">
          <div className="mb-3">
            <p className="text-4xl font-bold text-gray-800">{bookData.title}</p>
            <p className="text-lg text-gray-600 italic mb-1 line-clamp-1">
              by{" "}
              {authors.length > 0
                ? authors.map((author) => author.name).join(", ")
                : "Unknown Author"}
            </p>
            <StarRating value={average ?? 0} readOnly />
          </div>
          <hr />
          <p className="mt-2 border border-gray-200 rounded-lg p-3 text-gray-700 bg-gray-50">
            {typeof bookData.description === "string"
              ? bookData.description
              : bookData.description?.value}
          </p>
        </div>
      </div>
      <hr />
      {authors[0] && (
        <div className="items-center justify-center m-5 lg:w-4/5 lg:mx-auto">
          <p className="text-lg text-gray-600 italic mb-1 ml-2">
            About the author
          </p>
          <div className="md:flex border border-gray-100 rounded-lg p-3 bg-gray-200">
            <div className="md:w-1/4">
              {authors[0].photos?.[0] && (
                <img
                  src={`${imagesBaseUrl}/b/id/${authors[0].photos[0]}-M.jpg`}
                  className="rounded-lg shadow-lg w-auto"
                  alt={authors[0].name}
                />
              )}
              <div className="m-2 text-sm italic">
                <p>{authors[0].name}</p>
                <p>Birth date: {authors[0].birth_date}</p>
                {authors[0]?.death_date && (
                  <p>Death date: {authors[0].death_date}</p>
                )}
              </div>
            </div>
            <p className="bg-gray-50 text-gray-700 sm:mt-5 md:mt-0 md:ml-3 p-3 md:w-3/4 rounded-lg break-words">
              {typeof authors[0].bio === "string"
                ? authors[0].bio
                : authors[0].bio?.value}
            </p>
          </div>
        </div>
      )}
      <hr />
      <div className="m-5 lg:w-4/5 lg:mx-auto">
        <button
          className="rounded-lg mb-3 p-2.5 text-white font-semibold bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg border border-yellow-500 transition-transform transform hover:scale-105"
          onClick={() => {
            const auth = getAuth();
            const isAuthenticated = !!auth.currentUser;
            if (isAuthenticated) {
              setShowReviewModal(true);
            } else {
              alert("You must be logged in or registered to leave a review.");
            }
          }}
        >
          Make Review
        </button>
        {showReviewModal && (
          <ReviewComponent
            onClose={() => setShowReviewModal(false)}
            bookName={bookData.title}
          />
        )}
        <ReviewsList bookId={bookKey} />
      </div>
    </>
  );
}

export default BookDetails;
