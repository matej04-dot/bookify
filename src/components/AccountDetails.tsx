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
import { Spinner } from "./ui/spinner";
import { EmptyState } from "./ui/empty-state";

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
      where("userId", "==", authUser.uid),
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
      },
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
            },
          );
        } else {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Auth state error:", err);
        setError("Auth error");
        setLoading(false);
      },
    );

    return () => {
      unsubAuth();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Spinner label="Loading your account..." />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full px-4">
          <EmptyState
            tone="danger"
            title="Account unavailable"
            description={error}
          />
        </div>
      </div>
    );
  if (!authUser)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full px-4">
          <EmptyState
            title="Not signed in"
            description="Please sign in to access your account details."
          />
        </div>
      </div>
    );

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    authUser.displayName || "User",
  )}&background=eff6ff&color=0f172a&size=256`;

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 rounded-full bg-primary/70"></div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
              My Account
            </h1>
          </div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <svg
              className="h-4 w-4"
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
            <span>Home</span>
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card/95 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6 p-6 sm:p-8">
            <aside className="w-full lg:w-80 flex flex-col items-center lg:items-start">
              <div className="mb-4 rounded-2xl border border-border bg-muted/40 p-2">
                <img
                  src={avatarUrl}
                  alt={authUser.displayName ?? "User avatar"}
                  className="h-28 w-28 rounded-xl object-cover sm:h-32 sm:w-32"
                />
              </div>

              <div className="text-center lg:text-left w-full mb-6">
                <h2 className="mb-1 break-words text-2xl font-semibold text-foreground sm:text-3xl">
                  {authUser.displayName ?? profile?.displayName ?? "—"}
                </h2>
                <p className="break-all text-sm text-muted-foreground">
                  {authUser.email ?? profile?.email ?? "—"}
                </p>
              </div>

              <div className="w-full mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <svg
                        className="h-5 w-5 text-primary"
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
                    <div className="text-2xl font-semibold text-foreground">
                      {userReviews.length}
                    </div>
                    <div className="mt-1 text-xs font-medium text-muted-foreground">
                      Reviews
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <svg
                        className="h-5 w-5 text-muted-foreground"
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
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        profile?.role === "admin"
                          ? "border border-amber-300/60 bg-amber-100/80 text-amber-900"
                          : "border border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {profile?.role ?? "user"}
                    </span>
                    <div className="mt-2 text-xs font-medium text-muted-foreground">
                      Account Role
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-3">
                {profile?.role === "admin" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 font-semibold text-primary transition hover:bg-primary/15"
                  >
                    <svg
                      className="h-5 w-5"
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/50 bg-red-50 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-100"
                >
                  <svg
                    className="h-5 w-5"
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

            <main className="flex-1">
              <div className="mb-8">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">
                  <svg
                    className="h-6 w-6 text-primary"
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
                  <div className="rounded-2xl border border-border bg-muted/40 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="h-5 w-5 text-primary"
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
                      <div className="text-xs font-semibold uppercase text-muted-foreground">
                        Display Name
                      </div>
                    </div>
                    <div className="break-words text-base font-medium text-foreground">
                      {authUser.displayName ?? profile?.displayName ?? "—"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/40 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="h-5 w-5 text-primary"
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
                      <div className="text-xs font-semibold uppercase text-muted-foreground">
                        Last Login
                      </div>
                    </div>
                    <div className="text-sm font-medium text-foreground">
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

              <section>
                <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                  <h3 className="flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">
                    <svg
                      className="h-6 w-6 text-primary"
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
                  <div className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                    {userReviews.length}
                  </div>
                </div>

                {userReviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
                    <svg
                      className="mx-auto mb-4 h-16 w-16 text-muted-foreground"
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
                    <p className="mb-2 text-lg font-semibold text-foreground">
                      No reviews yet
                    </p>
                    <p className="mb-6 text-sm text-muted-foreground">
                      Start exploring books and share your thoughts!
                    </p>
                    <button
                      onClick={() => router.push("/")}
                      className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <svg
                        className="h-5 w-5"
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
                  <div className="grid max-h-[600px] grid-cols-1 gap-5 overflow-y-auto pr-2">
                    {userReviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-sm"
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
    </div>
  );
}
