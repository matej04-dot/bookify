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
import {
  Bookmark,
  BookOpen,
  CalendarDays,
  ExternalLink,
  Home,
  LogOut,
  Mail,
  Plus,
  Settings,
  ShieldCheck,
  Star,
} from "lucide-react";

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
  const displayName = authUser.displayName ?? profile?.displayName ?? userLabel;
  const email = authUser.email ?? profile?.email ?? "-";
  const role = profile?.role ?? "user";
  const lastLoginLabel = profile?.lastLogin
    ? profile.lastLogin.toDate().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
  const statCards = [
    {
      label: "Reviews",
      value: userReviews.length,
      icon: Star,
      tone: "bg-amber-50 text-amber-700 border-amber-200/70",
    },
    {
      label: "Wishlist",
      value: wishlistItems.length,
      icon: Bookmark,
      tone: "bg-primary/10 text-primary border-primary/20",
    },
    {
      label: "Role",
      value: role,
      icon: ShieldCheck,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-5 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="w-fit rounded-lg border border-border bg-background p-1.5 shadow-sm">
                {avatarLoadFailed ? (
                  <div className="flex h-20 w-20 items-center justify-center rounded-md bg-primary text-2xl font-semibold text-primary-foreground sm:h-24 sm:w-24">
                    {userInitials}
                  </div>
                ) : (
                  <Image
                    src={avatarUrl}
                    alt={authUser.displayName ?? "User avatar"}
                    width={96}
                    height={96}
                    unoptimized
                    onError={() => setAvatarLoadFailed(true)}
                    className="h-20 w-20 rounded-md object-cover sm:h-24 sm:w-24"
                  />
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    Account
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {role}
                  </span>
                </div>
                <h1 className="truncate text-2xl font-semibold text-foreground sm:text-4xl">
                  {displayName}
                </h1>
                <p className="mt-2 flex min-w-0 items-center gap-2 truncate text-sm text-muted-foreground sm:text-base">
                  <Mail className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{email}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end lg:max-w-sm">
              <button
                onClick={() => router.push("/")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-accent"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Home
              </button>
              {profile?.role === "admin" && (
                <button
                  onClick={() => router.push("/admin")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/20"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Admin
                </button>
              )}
              <button
                onClick={handleClick}
                className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-300/60 bg-red-50 px-4 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 sm:col-span-1"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid gap-2 border-t border-border bg-muted/20 p-3 sm:grid-cols-3 sm:p-4">
            {statCards.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-1 truncate text-xl font-semibold capitalize text-foreground">
                      {value}
                    </p>
                  </div>
                  <div className={`rounded-lg border p-1.5 ${tone}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </header>

        <main className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Account Activity
              </p>
              <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  Last Login
                </h2>
                <p className="text-sm font-semibold text-muted-foreground">
                  {lastLoginLabel}
                </p>
              </div>
            </div>
            <div
              className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50"
              role="tablist"
              aria-label="Account sections"
            >
              <button
                role="tab"
                aria-selected={activeTab === "reviews"}
                aria-controls="account-tab-reviews"
                id="account-tab-trigger-reviews"
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  activeTab === "reviews"
                    ? "border-primary/40 bg-card text-primary shadow-sm"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
                onClick={() => setActiveTab("reviews")}
              >
                <Star className="h-4 w-4" aria-hidden="true" />
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
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  activeTab === "wishlist"
                    ? "border-primary/40 bg-card text-primary shadow-sm"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
                onClick={() => setActiveTab("wishlist")}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                Wishlist
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                  {wishlistItems.length}
                </span>
              </button>
            </div>
          </div>

            {activeTab === "reviews" && (
              <section
                id="account-tab-reviews"
                role="tabpanel"
                aria-labelledby="account-tab-trigger-reviews"
                className="p-4 sm:p-5 lg:p-4"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      Your Reviews
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Helpful insights from your reads.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                    {userReviews.length} total
                  </span>
                </div>

                {userReviews.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="mb-2 text-lg font-semibold text-foreground">
                      No reviews yet
                    </p>
                    <p className="mb-6 text-sm text-muted-foreground">
                      Start exploring books and share your thoughts.
                    </p>
                    <button
                      onClick={() => router.push("/")}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/20"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Browse Books
                    </button>
                  </div>
                ) : (
                  <div
                    className="max-h-[min(62vh,36rem)] space-y-2 overflow-y-auto rounded-lg border border-border bg-background/40 p-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50"
                    aria-label="Scrollable review list"
                  >
                    {userReviews.map((review) => (
                      <div
                        key={review.id}
                        className="group relative overflow-hidden rounded-lg border border-border bg-card px-4 py-3 shadow-sm transition hover:border-primary/40 hover:bg-accent/20"
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
                className="p-4 sm:p-5 lg:p-4"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      Your Wishlist
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Books you saved for later reading.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                    {wishlistItems.length} saved
                  </span>
                </div>

                {wishlistLoading && (
                  <div className="py-12">
                    <Spinner label="Loading wishlist..." />
                  </div>
                )}

                {!wishlistLoading && wishlistError && (
                  <div className="rounded-lg border border-red-300/60 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {wishlistError}
                  </div>
                )}

                {!wishlistLoading &&
                  !wishlistError &&
                  wishlistItems.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                        <Bookmark className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <p className="mb-2 text-lg font-semibold text-foreground">
                        No books saved yet
                      </p>
                      <p className="mb-6 text-sm text-muted-foreground">
                        Start building your reading list from book details.
                      </p>
                      <button
                        onClick={() => router.push("/")}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/20"
                      >
                        Browse Books
                      </button>
                    </div>
                  )}

                {!wishlistLoading &&
                  !wishlistError &&
                  wishlistItems.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {wishlistItems.map((item) => {
                        const coverUrl = item.coverEditionKey
                          ? `${imagesBaseUrl}/b/id/${item.coverEditionKey}-M.jpg`
                          : null;

                        return (
                          <div
                            key={item.id}
                            className="flex min-h-full flex-col rounded-lg border border-border bg-background p-3 shadow-sm transition hover:border-primary/40 hover:bg-accent/20"
                          >
                            <div className="flex gap-3">
                              <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border bg-muted shadow-sm">
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
                                <p className="line-clamp-2 text-sm font-semibold text-foreground">
                                  {item.bookName || "Unknown book"}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {Array.isArray(item.authors) &&
                                  item.authors.length > 0
                                    ? item.authors.join(", ")
                                    : "Unknown author"}
                                </p>
                                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                  <CalendarDays
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                  {toReadableDate(item.addedAt)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-2 border-t border-border pt-3">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/bookDetails/${encodeURIComponent(item.bookID)}`,
                                  )
                                }
                                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary transition hover:bg-primary/20"
                              >
                                <ExternalLink
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                                Open Details
                              </button>
                              <button
                                onClick={() => handleRemoveWishlist(item.bookID)}
                                disabled={removingBookID === item.bookID}
                                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Bookmark
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
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
  );
}
