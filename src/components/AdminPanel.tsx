"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getClientAuth,
  getClientDb,
  subscribeToAuthChanges,
} from "../firebase-config";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui/spinner";
import type {
  AdminDashboardStats,
  AdminStatsItem,
} from "../types/Types";

type UserDoc = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  role?: string | null;
  isBanned?: boolean;
  bannedReason?: string | null;
  createdAt?: any;
  [key: string]: any;
};

const getInitials = (value: string) => {
  const base = value.includes("@") ? value.split("@")[0] : value;
  const parts = base.split(/[\s._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase() || "U";
};

type InitialsAvatarProps = {
  label: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  background: string;
  color: string;
};

const InitialsAvatar = ({
  label,
  alt,
  width,
  height,
  className,
  background,
  color,
}: InitialsAvatarProps) => {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const initials = getInitials(label);
  const size = Math.max(width, height, 64);
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    label,
  )}&background=${background}&color=${color}&size=${size}`;

  if (avatarLoadFailed) {
    return (
      <div
        className={`${className} bg-slate-700 text-white font-bold flex items-center justify-center`}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={avatarUrl}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      onError={() => setAvatarLoadFailed(true)}
      className={className}
    />
  );
};

type ReviewAggregate = {
  createdAtMs: number;
  bookId: string;
  bookLabel: string;
  userId: string;
  userLabel: string;
};

const toTimestampMs = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  if (value && typeof value === "object") {
    const timestampLike = value as {
      toMillis?: () => unknown;
      toDate?: () => unknown;
    };

    if (typeof timestampLike.toMillis === "function") {
      const ms = Number(timestampLike.toMillis());
      if (Number.isFinite(ms)) {
        return ms;
      }
    }

    if (typeof timestampLike.toDate === "function") {
      const dateValue = timestampLike.toDate();
      if (dateValue instanceof Date) {
        const ms = dateValue.getTime();
        if (Number.isFinite(ms)) {
          return ms;
        }
      }
    }
  }

  return 0;
};

const topFive = (input: Map<string, AdminStatsItem>): AdminStatsItem[] =>
  Array.from(input.values())
    .sort((a, b) => {
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }

      return a.label.localeCompare(b.label);
    })
    .slice(0, 5);

const toReviewAggregate = (data: Record<string, unknown>): ReviewAggregate => {
  const bookId = typeof data.bookId === "string" ? data.bookId.trim() : "";
  const userId = typeof data.userId === "string" ? data.userId.trim() : "";

  return {
    createdAtMs: toTimestampMs(data.createdAt),
    bookId,
    bookLabel:
      typeof data.bookName === "string" && data.bookName.trim().length > 0
        ? data.bookName.trim()
        : bookId,
    userId,
    userLabel:
      typeof data.username === "string" && data.username.trim().length > 0
        ? data.username.trim()
        : userId,
  };
};

const applyCountDelta = (
  target: Map<string, AdminStatsItem>,
  key: string,
  label: string,
  delta: number,
) => {
  if (!key || delta === 0) {
    return;
  }

  const existing = target.get(key);
  const nextCount = (existing?.reviewCount ?? 0) + delta;

  if (nextCount <= 0) {
    target.delete(key);
    return;
  }

  target.set(key, {
    key,
    label: label || existing?.label || key,
    reviewCount: nextCount,
  });
};

const formatCompactNumber = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
};

function AdminPanel() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [liveStats, setLiveStats] = useState<AdminDashboardStats | null>(null);
  const [apiStats, setApiStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [moderationActionUserId, setModerationActionUserId] = useState<
    string | null
  >(null);

  const router = useRouter();

  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (user) => {
      if (!user?.uid) {
        setAdminUserId(null);
        setIsAdmin(false);
        setLiveStats(null);
        setApiStats(null);
        setStatsError(null);
        setAuthLoading(false);
        return;
      }

      try {
        setAdminUserId(user.uid);
        const db = getClientDb();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? (userDoc.data().role as string) : null;
        setIsAdmin(role === "admin");
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (authLoading || !isAdmin) {
      setApiStats(null);
      setStatsError(null);
      setStatsLoading(false);
      return;
    }

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadApiStats = async (showLoader: boolean) => {
      if (showLoader) {
        setStatsLoading(true);
      }

      try {
        const authUser = getClientAuth().currentUser;
        if (!authUser) {
          throw new Error("Missing authenticated admin user");
        }

        const idToken = await authUser.getIdToken();
        const response = await fetch("/api/admin/stats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to fetch admin stats");
        }

        const payload = (await response.json()) as AdminDashboardStats;

        if (!active) {
          return;
        }

        setApiStats({
          totalUsers:
            typeof payload?.totalUsers === "number" ? payload.totalUsers : null,
          totalReviews:
            typeof payload?.totalReviews === "number"
              ? payload.totalReviews
              : null,
          totalWishlistItems:
            typeof payload?.totalWishlistItems === "number"
              ? payload.totalWishlistItems
              : null,
          activeUsers30d:
            typeof payload?.activeUsers30d === "number"
              ? payload.activeUsers30d
              : null,
          reviewsLast24h:
            typeof payload?.reviewsLast24h === "number"
              ? payload.reviewsLast24h
              : null,
          reviewsLast7d:
            typeof payload?.reviewsLast7d === "number"
              ? payload.reviewsLast7d
              : null,
          topBooksByReviewCount: Array.isArray(payload?.topBooksByReviewCount)
            ? payload.topBooksByReviewCount
            : [],
          topUsersByReviewCount: Array.isArray(payload?.topUsersByReviewCount)
            ? payload.topUsersByReviewCount
            : [],
        });
        setStatsError(null);
      } catch {
        if (active) {
          setStatsError(
            "Extended server statistics are temporarily unavailable.",
          );
        }
      } finally {
        if (active && showLoader) {
          setStatsLoading(false);
        }
      }
    };

    void loadApiStats(true);
    intervalId = setInterval(() => {
      void loadApiStats(false);
    }, 60_000);

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const db = getClientDb();
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as any;
          return {
            id: d.id,
            email: data.email ?? null,
            displayName: data.displayName ?? null,
            role: data.role ?? null,
            createdAt: data.createdAt ?? null,
            ...data,
          } as UserDoc;
        });
        setUsers(arr);
        setLoading(false);
      },
      () => {
        setError("Failed to load users");
        setLoading(false);
      },
    );

    return () => unsub();
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin) {
      setLiveStats(null);
      return;
    }

    const db = getClientDb();
    const reviewsQuery = query(collection(db, "reviews"));

    const reviewIndex = new Map<string, ReviewAggregate>();
    const bookCounts = new Map<string, AdminStatsItem>();
    const userCounts = new Map<string, AdminStatsItem>();

    const attachReview = (reviewId: string, entry: ReviewAggregate) => {
      reviewIndex.set(reviewId, entry);

      applyCountDelta(bookCounts, entry.bookId, entry.bookLabel, 1);
      applyCountDelta(userCounts, entry.userId, entry.userLabel, 1);
    };

    const detachReview = (reviewId: string) => {
      const existing = reviewIndex.get(reviewId);
      if (!existing) {
        return;
      }

      reviewIndex.delete(reviewId);

      applyCountDelta(bookCounts, existing.bookId, existing.bookLabel, -1);
      applyCountDelta(userCounts, existing.userId, existing.userLabel, -1);
    };

    const publishStats = () => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      let reviewsLast24h = 0;
      let reviewsLast7d = 0;

      for (const entry of reviewIndex.values()) {
        if (entry.createdAtMs >= dayAgo) {
          reviewsLast24h += 1;
        }

        if (entry.createdAtMs >= weekAgo) {
          reviewsLast7d += 1;
        }
      }

      setLiveStats({
        totalReviews: reviewIndex.size,
        reviewsLast24h,
        reviewsLast7d,
        topBooksByReviewCount: topFive(bookCounts),
        topUsersByReviewCount: topFive(userCounts),
      });
    };

    const unsub = onSnapshot(
      reviewsQuery,
      (snap) => {
        snap.docChanges().forEach((change) => {
          const reviewId = change.doc.id;

          if (change.type === "removed") {
            detachReview(reviewId);
            return;
          }

          const nextEntry = toReviewAggregate(
            change.doc.data() as Record<string, unknown>,
          );

          if (change.type === "modified") {
            detachReview(reviewId);
          }

          attachReview(reviewId, nextEntry);
        });

        publishStats();
      },
      () => {
        setLiveStats(null);
      },
    );

    return () => {
      unsub();
    };
  }, [authLoading, isAdmin]);

  const viewDetails = (userId: string) => {
    if (!isAdmin || !userId) {
      return;
    }
    router.push(`/admin/users/${encodeURIComponent(userId)}`);
  };

  const moderateUser = async (user: UserDoc, action: "ban" | "unban") => {
    if (!isAdmin || !user?.id) {
      return;
    }

    if (user.id === adminUserId) {
      alert("You cannot change moderation state for your own account.");
      return;
    }

    const authUser = getClientAuth().currentUser;
    if (!authUser) {
      alert("You must be signed in as admin.");
      return;
    }

    let reason: string | null = null;
    if (action === "ban") {
      const input = window.prompt("Enter a reason for ban:", "");
      if (input === null) {
        return;
      }

      const normalized = input.trim();
      if (!normalized) {
        alert("Ban reason is required.");
        return;
      }

      reason = normalized;
    }

    try {
      setModerationActionUserId(user.id);
      const idToken = await authUser.getIdToken();
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}/ban`,
        {
          method: action === "ban" ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: action === "ban" ? JSON.stringify({ reason }) : undefined,
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed moderation request");
      }
    } catch (error: any) {
      alert(error?.message || "Failed to update moderation state.");
    } finally {
      setModerationActionUserId(null);
    }
  };

  const dashboardStats = apiStats ?? liveStats;
  const totalUsersValue = apiStats?.totalUsers ?? users.length;
  const topBooks = dashboardStats?.topBooksByReviewCount ?? [];
  const topUsers = dashboardStats?.topUsersByReviewCount ?? [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Spinner label="Checking permissions..." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl rounded-2xl border border-red-300/60 bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-2xl font-semibold text-red-800">
            Access denied
          </h2>
          <p className="mb-5 text-red-700">
            You do not have admin permissions to access this page.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center rounded-full border border-red-300/60 bg-white px-5 py-2.5 font-semibold text-red-700 transition hover:bg-red-100"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-1 rounded-full bg-primary/70"></div>
              <div>
                <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                  Admin Panel
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage users, reviews and platform insights
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
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
              Home
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-primary">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="font-semibold">Total Users:</span>
              </div>
              <div className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                {formatCompactNumber(totalUsersValue)}
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600">
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
                    d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m12 0H7m10-10a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="font-semibold">Active Users (30d):</span>
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                {formatCompactNumber(dashboardStats?.activeUsers30d)}
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-primary">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="font-semibold">Total Reviews:</span>
              </div>
              <div className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                {formatCompactNumber(dashboardStats?.totalReviews)}
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-primary">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-semibold">Reviews (24h):</span>
              </div>
              <div className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                {formatCompactNumber(dashboardStats?.reviewsLast24h)}
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-cyan-700">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-semibold">Review Velocity (7d):</span>
              </div>
              <div className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
                {formatCompactNumber(dashboardStats?.reviewsLast7d)}
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-violet-700">
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
                    d="M5 5a3 3 0 00-3 3v11a1 1 0 001.447.894L12 16l8.553 3.894A1 1 0 0022 19V8a3 3 0 00-3-3H5z"
                  />
                </svg>
                <span className="font-semibold">Wishlist Items:</span>
              </div>
              <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800">
                {formatCompactNumber(dashboardStats?.totalWishlistItems)}
              </div>
            </div>
          </div>

          {statsLoading && !dashboardStats && (
            <div className="mt-4 flex items-center justify-center rounded-2xl border border-border bg-card p-4">
              <Spinner label="Loading statistics..." />
            </div>
          )}

          {statsError && (
            <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              <span>
                {statsError} Showing fallback analytics where available.
              </span>
            </div>
          )}

          {!statsLoading && dashboardStats && (
            <div className="mt-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-foreground">
                    Top 5 Books by Reviews
                  </h3>
                  {topBooks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No review data yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {topBooks.map((item) => (
                        <li
                          key={item.key}
                          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                        >
                          <span className="truncate pr-3 text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                            {item.reviewCount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-foreground">
                    Active Reviewers
                  </h3>
                  {topUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No review data yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {topUsers.map((item) => (
                        <li
                          key={item.key}
                          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                        >
                          <span className="truncate pr-3 text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                            {item.reviewCount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" label="Loading users..." />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-300/60 bg-red-50 p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="lg:hidden grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {users.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <p className="font-medium text-muted-foreground">
                    No users found
                  </p>
                </div>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
                >
                  <div className="border-b border-border bg-muted/40 p-4">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar
                        label={u.displayName ?? u.email ?? "User"}
                        alt={u.displayName ?? u.email ?? "User avatar"}
                        width={56}
                        height={56}
                        background="FFFFFF"
                        color="2563EB"
                        className="h-14 w-14 rounded-xl border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-lg font-semibold text-foreground">
                          {u.displayName ?? "Unknown"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                              u.role === "admin"
                                ? "border border-amber-300/60 bg-amber-100/80 text-amber-900"
                                : "border border-border bg-background text-muted-foreground"
                            }`}
                          >
                            {u.role ?? "user"}
                          </span>
                          {u.isBanned && (
                            <span className="inline-flex items-center rounded-full border border-red-300/60 bg-red-100/80 px-2 py-1 text-xs font-semibold text-red-900">
                              banned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-2 break-words text-sm text-muted-foreground">
                      <svg
                        className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{u.email ?? "—"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <svg
                        className="w-4 h-4 text-gray-400"
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
                      {u.createdAt?.toDate
                        ? u.createdAt.toDate().toLocaleDateString()
                        : "—"}
                    </div>

                    {u.isBanned && u.bannedReason && (
                      <div className="rounded-lg border border-red-200/70 bg-red-50 px-3 py-2 text-xs text-red-700">
                        Reason: {u.bannedReason}
                      </div>
                    )}

                    <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
                      <button
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                        onClick={() => viewDetails(u.id)}
                      >
                        View Details
                      </button>
                      <button
                        disabled={
                          moderationActionUserId === u.id || u.id === adminUserId
                        }
                        className={`w-full rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                          u.isBanned
                            ? "border-emerald-300/60 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "border-red-300/60 bg-red-50 text-red-800 hover:bg-red-100"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                        onClick={() =>
                          moderateUser(u, u.isBanned ? "unban" : "ban")
                        }
                      >
                        {moderationActionUserId === u.id
                          ? "Working..."
                          : u.isBanned
                            ? "Unban"
                            : "Ban"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:block">
              <table className="min-w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        <p className="font-medium text-muted-foreground">
                          No users found
                        </p>
                      </td>
                    </tr>
                  )}

                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar
                            label={u.displayName ?? u.email ?? "User"}
                            alt={u.displayName ?? u.email ?? "User avatar"}
                            width={40}
                            height={40}
                            background="eff6ff"
                            color="2563eb"
                            className="h-10 w-10 rounded-lg border border-border"
                          />
                          <div>
                            <div className="font-semibold text-foreground">
                              {u.displayName ?? "Unknown"}
                            </div>
                            <div className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                              {u.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {u.email ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              u.role === "admin"
                                ? "border border-amber-300/60 bg-amber-100/80 text-amber-900"
                                : "border border-border bg-background text-muted-foreground"
                            }`}
                          >
                            {u.role ?? "user"}
                          </span>
                          {u.isBanned && (
                            <span className="inline-flex items-center rounded-full border border-red-300/60 bg-red-100/80 px-3 py-1 text-xs font-semibold text-red-900">
                              banned
                            </span>
                          )}
                        </div>
                        {u.isBanned && u.bannedReason && (
                          <div className="mt-2 max-w-xs truncate text-xs text-red-700">
                            {u.bannedReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {u.createdAt?.toDate
                          ? u.createdAt.toDate().toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={
                              moderationActionUserId === u.id ||
                              u.id === adminUserId
                            }
                            className={`h-10 min-w-[96px] whitespace-nowrap rounded-lg border px-3 py-2 text-center text-sm font-semibold transition ${
                              u.isBanned
                                ? "border-emerald-300/60 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                : "border-red-300/60 bg-red-50 text-red-800 hover:bg-red-100"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                            onClick={() =>
                              moderateUser(u, u.isBanned ? "unban" : "ban")
                            }
                          >
                            {moderationActionUserId === u.id
                              ? "Working..."
                              : u.isBanned
                                ? "Unban"
                                : "Ban"}
                          </button>
                          <button
                            className="h-10 min-w-[112px] whitespace-nowrap rounded-lg border border-border bg-background px-3 py-2 text-center text-sm font-medium text-foreground transition hover:bg-muted"
                            onClick={() => viewDetails(u.id)}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
