"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase-config";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import ReviewItem from "./ReviewItem";

export default function AccountDetails() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const profileUnsubRef = useRef<(() => void) | null>(null);
  const reviewsUnsubRef = useRef<(() => void) | null>(null);

  const handleClick = async () => {
    try {
      if (reviewsUnsubRef.current) {
        reviewsUnsubRef.current();
        reviewsUnsubRef.current = null;
      }
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed");
    } finally {
      router.push("/");
      setAuthUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reviewsUnsubRef.current) {
      reviewsUnsubRef.current();
      reviewsUnsubRef.current = null;
      setUserReviews([]);
    }
    if (!authUser?.uid) return;

    const q = query(
      collection(db, "reviews"),
      where("userId", "==", authUser.uid)
    );

    reviewsUnsubRef.current = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d: QueryDocumentSnapshot) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        arr.sort((a, b) => {
          const ta = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : a.createdAt
            ? Number(a.createdAt)
            : 0;
          const tb = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : b.createdAt
            ? Number(b.createdAt)
            : 0;
          return tb - ta;
        });

        setUserReviews(arr);
      },
      (err) => {
        console.error("User reviews snapshot error:", err);
      }
    );

    return () => {
      if (reviewsUnsubRef.current) {
        reviewsUnsubRef.current();
        reviewsUnsubRef.current = null;
      }
    };
  }, [authUser?.uid]);

  useEffect(() => {
    profileUnsubRef.current = null;
    const unsubAuth = onAuthStateChanged(
      auth,
      (user) => {
        setAuthUser(user);
        setProfile(null);
        setError(null);
        setLoading(!!user);

        if (profileUnsubRef.current) {
          profileUnsubRef.current();
          profileUnsubRef.current = null;
        }

        if (user) {
          const ref = doc(db, "users", user.uid);
          profileUnsubRef.current = onSnapshot(
            ref,
            (snap) => {
              setProfile(snap.exists() ? snap.data() : null);
              setLoading(false);
            },
            (err) => {
              console.error("AccountDetails snapshot error:", err);
              setError("Failed to load profile");
              setLoading(false);
            }
          );
        } else {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Auth state error:", err);
        setError("Auth error");
        setLoading(false);
      }
    );

    return () => {
      unsubAuth();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  if (!authUser)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center max-w-md shadow-sm">
          <p className="text-gray-600">Not signed in</p>
        </div>
      </div>
    );

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    authUser.displayName || "User"
  )}&background=eff6ff&color=0f172a&size=256`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header with Home Button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Account
            </h1>
          </div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 p-6 sm:p-8">
            {/* Left Sidebar */}
            <aside className="w-full lg:w-80 flex flex-col items-center lg:items-start">
              <div className="relative group mb-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <img
                  src={avatarUrl}
                  alt={authUser.displayName ?? "User avatar"}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
              </div>

              <div className="text-center lg:text-left w-full mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-1">
                  {authUser.displayName ?? profile?.displayName ?? "—"}
                </h2>
                <p className="text-sm text-gray-500 break-all">
                  {authUser.email ?? profile?.email ?? "—"}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="w-full mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 text-center shadow-sm">
                    <div className="flex items-center justify-center mb-1">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {userReviews.length}
                    </div>
                    <div className="text-xs text-blue-700 font-medium mt-1">
                      Reviews
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 text-center shadow-sm">
                    <div className="flex items-center justify-center mb-1">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        profile?.role === "admin"
                          ? "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 border border-amber-300"
                          : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 border border-gray-400"
                      }`}
                    >
                      {profile?.role ?? "user"}
                    </span>
                    <div className="text-xs text-gray-600 font-medium mt-2">
                      Account Role
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3">
                {profile?.role === "admin" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={handleClick}
                  className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              <div className="mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Account Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <div className="text-xs font-semibold text-blue-700 uppercase">
                        Display Name
                      </div>
                    </div>
                    <div className="text-base font-medium text-gray-900 break-words">
                      {authUser.displayName ?? profile?.displayName ?? "—"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-xs font-semibold text-blue-700 uppercase">
                        Last Login
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {profile?.lastLogin
                        ? profile.lastLogin
                            .toDate()
                            .toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <section>
                <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-200">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    Your Reviews
                  </h3>
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {userReviews.length}
                  </div>
                </div>

                {userReviews.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-12 text-center">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    <p className="text-lg text-gray-900 font-semibold mb-2">
                      No reviews yet
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      Start exploring books and share your thoughts!
                    </p>
                    <button
                      onClick={() => router.push("/")}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
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
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      Browse Books
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {userReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200"
                      >
                        <ReviewItem review={review} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}
