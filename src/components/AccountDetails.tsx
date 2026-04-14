"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  getClientDb,
  logoutCurrentUser,
  subscribeToAuthChanges,
} from "../firebase-config";
import { type User } from "firebase/auth";
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
import { imagesBaseUrl } from "@/utils/Constants";
import type { WishlistItem } from "@/types/Types";
import { getWishlistItems, removeWishlistItem } from "@/services/wishlist";

const getInitials = (value: string) => {
  const base = value.includes("@") ? value.split("@")[0] : value;
  const parts = base.split(/[\s._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase() || "U";
};

const toReadableDate = (value: unknown) => {
  if (value && typeof value === "object") {
    const timestampLike = value as { toDate?: () => unknown };

    if (typeof timestampLike.toDate === "function") {
      const dateValue = timestampLike.toDate();
      if (dateValue instanceof Date && Number.isFinite(dateValue.getTime())) {
        return dateValue.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }
    }
  }

  return "Recently";
};

export default function AccountDetails() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [removingBookID, setRemovingBookID] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reviews" | "wishlist">("reviews");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const profileUnsubRef = useRef<(() => void) | null>(null);
  const reviewsUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [authUser?.uid]);

  const handleClick = async () => {
    try {
      if (reviewsUnsubRef.current) {
        reviewsUnsubRef.current();
        reviewsUnsubRef.current = null;
      }
      await logoutCurrentUser();
    } catch {
      setError("Logout failed");
    } finally {
      router.push("/");
      setAuthUser(null);
      setProfile(null);
      setWishlistItems([]);
      setLoading(false);
    }
  };

  const refreshWishlist = async () => {
    if (!authUser?.uid) {
      setWishlistItems([]);
      return;
    }

    try {
      setWishlistLoading(true);
      setWishlistError(null);
      const items = await getWishlistItems();
      setWishlistItems(items);
    } catch {
      setWishlistError("Failed to load wishlist");
      setWishlistItems([]);
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    if (!authUser?.uid) {
      setWishlistItems([]);
      setWishlistError(null);
      return;
    }

    refreshWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.uid]);

  useEffect(() => {
    if (reviewsUnsubRef.current) {
      reviewsUnsubRef.current();
      reviewsUnsubRef.current = null;
      setUserReviews([]);
    }
    if (!authUser?.uid) return;

    const db = getClientDb();

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
      () => {},
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
    const unsubAuth = subscribeToAuthChanges((user) => {
      setAuthUser(user);
      setProfile(null);
      setError(null);
      setLoading(!!user);

      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      if (user) {
        const db = getClientDb();
        const ref = doc(db, "users", user.uid);
        profileUnsubRef.current = onSnapshot(
          ref,
          (snap) => {
            setProfile(snap.exists() ? snap.data() : null);
            setLoading(false);
          },
          () => {
            setError("Failed to load profile");
            setLoading(false);
          },
        );
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  const handleRemoveWishlist = async (bookID: string) => {
    if (!bookID) {
      return;
    }

    const confirmed = confirm("Remove this book from your wishlist?");
    if (!confirmed) {
      return;
    }

    try {
      setRemovingBookID(bookID);
      await removeWishlistItem(bookID);
      setWishlistItems((prev) => prev.filter((item) => item.bookID !== bookID));
    } catch {
      alert("Failed to remove wishlist item.");
    } finally {
      setRemovingBookID(null);
    }
  };

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

  const userLabel = authUser.displayName || authUser.email || "User";
  const userInitials = getInitials(userLabel);
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userLabel,
  )}&background=eff6ff&color=0f172a&size=256`;

  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_500px_at_10%_-10%,rgba(14,116,144,0.10),transparent),radial-gradient(800px_500px_at_90%_-20%,rgba(59,130,246,0.10),transparent)] bg-background py-6 sm:py-10">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-12 w-1.5 rounded-full bg-primary"></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                  Personal Dashboard
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
                  My Account
                </h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Manage your profile, reviews and wishlist in one place.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <svg
                aria-hidden="true"
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
        </header>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_10px_35px_-20px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-start">
            <aside className="w-full lg:sticky lg:top-6 lg:w-80 xl:w-96">
              <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/40 to-card p-5 shadow-sm">
                <div className="mb-5 flex flex-col items-center sm:items-start">
                  <div className="mb-4 rounded-2xl border border-border/80 bg-background/80 p-2">
                    {avatarLoadFailed ? (
                      <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-border bg-primary/90 text-2xl font-bold text-primary-foreground sm:h-32 sm:w-32">
                        {userInitials}
                      </div>
                    ) : (
                      <Image
                        src={avatarUrl}
                        alt={authUser.displayName ?? "User avatar"}
                        width={128}
                        height={128}
                        unoptimized
                        onError={() => setAvatarLoadFailed(true)}
                        className="h-28 w-28 rounded-xl object-cover sm:h-32 sm:w-32"
                      />
                    )}
                  </div>

                  <div className="w-full text-center sm:text-left">
                    <h2 className="mb-1 break-words text-2xl font-semibold text-foreground sm:text-3xl">
                      {authUser.displayName ?? profile?.displayName ?? "-"}
                    </h2>
                    <p className="break-words text-sm text-muted-foreground">
                      {authUser.email ?? profile?.email ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-xl border border-border/80 bg-background/70 p-3 text-center sm:text-left">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      Reviews
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-foreground">
                      {userReviews.length}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-background/70 p-3 text-center sm:text-left">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      Wishlist
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-foreground">
                      {wishlistItems.length}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-background/70 p-3 text-center sm:text-left">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      Role
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {profile?.role ?? "user"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {profile?.role === "admin" && (
                    <button
                      onClick={() => router.push("/admin")}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 font-semibold text-primary transition hover:bg-primary/20"
                    >
                      <svg
                        aria-hidden="true"
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
                      aria-hidden="true"
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
              </div>
            </aside>

            <main className="flex-1">
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-background to-muted/20 p-5">
                  <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Display Name
                  </div>
                  <div className="break-words text-base font-medium text-foreground">
                    {authUser.displayName ?? profile?.displayName ?? "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-background to-muted/20 p-5">
                  <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Last Login
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {profile?.lastLogin
                      ? profile.lastLogin.toDate().toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </div>
                </div>
              </div>

              <div
                className="mb-5 flex flex-wrap items-center gap-2 border-b border-border/70 pb-3"
                role="tablist"
                aria-label="Account sections"
              >
                <button
                  role="tab"
                  aria-selected={activeTab === "reviews"}
                  aria-controls="account-tab-reviews"
                  id="account-tab-trigger-reviews"
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    activeTab === "reviews"
                      ? "border-primary/40 bg-primary/15 text-primary shadow-sm"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("reviews")}
                >
                  Reviews
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                    {userReviews.length}
                  </span>
                </button>

                <button
                  role="tab"
                  aria-selected={activeTab === "wishlist"}
                  aria-controls="account-tab-wishlist"
                  id="account-tab-trigger-wishlist"
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    activeTab === "wishlist"
                      ? "border-primary/40 bg-primary/15 text-primary shadow-sm"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("wishlist")}
                >
                  Wishlist
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                    {wishlistItems.length}
                  </span>
                </button>
              </div>

              {activeTab === "reviews" && (
                <section
                  id="account-tab-reviews"
                  role="tabpanel"
                  aria-labelledby="account-tab-trigger-reviews"
                  className="rounded-2xl border border-border/70 bg-card p-5"
                >
                  <div className="mb-5 flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">
                        Your Reviews
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Helpful insights from your reads.
                      </p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                      {userReviews.length} total
                    </div>
                  </div>

                  {userReviews.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
                      <p className="mb-2 text-lg font-semibold text-foreground">
                        No reviews yet
                      </p>
                      <p className="mb-6 text-sm text-muted-foreground">
                        Start exploring books and share your thoughts.
                      </p>
                      <button
                        onClick={() => router.push("/")}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-6 py-3 font-semibold text-primary transition hover:bg-primary/20"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v12m6-6H6"
                          />
                        </svg>
                        Browse Books
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {userReviews.map((review) => (
                        <div
                          key={review.id}
                          className="group relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-background to-muted/10 p-4 transition hover:border-primary/40 hover:shadow-md"
                        >
                          <div className="absolute inset-y-0 left-0 w-1 bg-primary/20 transition group-hover:bg-primary/40" />
                          <ReviewItem review={review} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "wishlist" && (
                <section
                  id="account-tab-wishlist"
                  role="tabpanel"
                  aria-labelledby="account-tab-trigger-wishlist"
                  className="rounded-2xl border border-border/70 bg-card p-5"
                >
                  <div className="mb-5 flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">
                        Your Wishlist
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Books you saved for later reading.
                      </p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                      {wishlistItems.length} saved
                    </div>
                  </div>

                  {wishlistLoading && (
                    <div className="py-12">
                      <Spinner label="Loading wishlist..." />
                    </div>
                  )}

                  {!wishlistLoading && wishlistError && (
                    <div className="rounded-2xl border border-red-300/60 bg-red-50 p-4 text-sm font-semibold text-red-700">
                      {wishlistError}
                    </div>
                  )}

                  {!wishlistLoading &&
                    !wishlistError &&
                    wishlistItems.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
                        <p className="mb-2 text-lg font-semibold text-foreground">
                          No books saved yet
                        </p>
                        <p className="mb-6 text-sm text-muted-foreground">
                          Start building your reading list from book details.
                        </p>
                        <button
                          onClick={() => router.push("/")}
                          className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-6 py-3 font-semibold text-primary transition hover:bg-primary/20"
                        >
                          Browse Books
                        </button>
                      </div>
                    )}

                  {!wishlistLoading &&
                    !wishlistError &&
                    wishlistItems.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {wishlistItems.map((item) => {
                          const coverUrl = item.coverEditionKey
                            ? `${imagesBaseUrl}/b/id/${item.coverEditionKey}-M.jpg`
                            : null;

                          return (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-border/80 bg-gradient-to-br from-background to-muted/10 p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                            >
                              <div className="mb-3 flex flex-col gap-3 sm:flex-row">
                                <div className="h-44 w-full flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:h-28 sm:w-20">
                                  {coverUrl ? (
                                    <Image
                                      src={coverUrl}
                                      alt={`${item.bookName} cover`}
                                      width={160}
                                      height={176}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                      No cover
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
                                    {item.bookName || "Unknown book"}
                                  </p>
                                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                                    {Array.isArray(item.authors) &&
                                    item.authors.length > 0
                                      ? item.authors.join(", ")
                                      : "Unknown author"}
                                  </p>
                                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                    <svg
                                      aria-hidden="true"
                                      className="h-3.5 w-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    Added: {toReadableDate(item.addedAt)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row">
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/bookDetails/${encodeURIComponent(item.bookID)}`,
                                    )
                                  }
                                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/15 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/25"
                                >
                                  <svg
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12H9m12 0A9 9 0 113 12a9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Open Details
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemoveWishlist(item.bookID)
                                  }
                                  disabled={removingBookID === item.bookID}
                                  className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {removingBookID === item.bookID
                                    ? "Removing..."
                                    : "Remove"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </section>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
