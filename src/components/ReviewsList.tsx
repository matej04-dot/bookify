"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Query,
  type DocumentData,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase-config";
import type { Review } from "../types/Types";
import ReviewItem from "./ReviewItem";

interface ReviewListProps {
  bookId?: string;
}

const ReviewsList: React.FC<ReviewListProps> = ({ bookId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        if (!bookId) {
          setReviews([]);
          setLoading(false);
          return;
        }

        const normalized = decodeURIComponent(bookId)
          .replace(/^\/?works\//i, "")
          .trim();

        const col = collection(db, "reviews");
        const q: Query<DocumentData> = query(
          col,
          where("bookId", "==", normalized),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const data: Review[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Review[];
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
      setLoading(false);
    };

    fetchReviews();
  }, [bookId]);

  if (loading)
    return <div className="text-center text-gray-500">Loading reviews...</div>;

  return (
    <div className="rounded-lg border mt-2 p-3 md:p-0 border-gray-200">
      {reviews.length === 0 ? (
        <div className="text-center text-gray-500 m-2">No reviews found</div>
      ) : (
        reviews.map((review) => <ReviewItem key={review.id} review={review} />)
      )}
    </div>
  );
};

export default ReviewsList;
