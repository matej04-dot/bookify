"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase-config";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui/spinner";

type UserDoc = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  role?: string | null;
  createdAt?: any;
  [key: string]: any;
};

function AdminPanel() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user?.uid) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? (userDoc.data().role as string) : null;
        setIsAdmin(role === "admin");
      } catch (err) {
        console.error("Failed to verify admin role:", err);
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (authLoading || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
      (err) => {
        console.error("AdminPanel users snapshot failed:", err);
        setError("Failed to load users");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [authLoading, isAdmin]);

  const promoteToAdmin = async (userId: string) => {
    if (!isAdmin) return;
    if (!userId) return;
    const ok = confirm("Promote this user to admin?");
    if (!ok) return;

    const authUser = auth.currentUser;
    if (!authUser) {
      alert("You must be logged in as admin.");
      return;
    }

    try {
      setPromotingUserId(userId);
      const idToken = await authUser.getIdToken();

      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/promote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to promote user");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: "admin" } : u))
      );
    } catch (err) {
      console.error("Failed to promote user:", err);
      alert("Failed to promote user. Check console for details.");
    } finally {
      setPromotingUserId(null);
    }
  };

  const viewDetails = (userId: string) => {
    if (!isAdmin) return;
    if (!userId) return;
    router.push(`/admin/users/${encodeURIComponent(userId)}`);
  };

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
          <h2 className="mb-2 text-2xl font-semibold text-red-800">Access denied</h2>
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
                  Manage users and permissions
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
              {users.length}
            </div>
          </div>
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
                  <p className="font-medium text-muted-foreground">No users found</p>
                </div>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
                >
                  <div className="border-b border-border bg-muted/40 p-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          u.displayName ?? u.email ?? "User"
                        )}&background=FFFFFF&color=2563EB&size=128`;
                        return (
                          <img
                            src={avatarUrl}
                            alt={u.displayName ?? u.email ?? "User avatar"}
                            className="h-14 w-14 rounded-xl border border-border"
                          />
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-lg font-semibold text-foreground">
                          {u.displayName ?? "Unknown"}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                            u.role === "admin"
                              ? "border border-amber-300/60 bg-amber-100/80 text-amber-900"
                              : "border border-border bg-background text-muted-foreground"
                          }`}
                        >
                          {u.role ?? "user"}
                        </span>
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

                    <div className="flex gap-2 border-t border-border pt-3">
                      <button
                        className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                        onClick={() => viewDetails(u.id)}
                      >
                        View Details
                      </button>
                      <button
                        className="flex-1 rounded-lg border border-primary/20 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => promoteToAdmin(u.id)}
                        disabled={promotingUserId === u.id || u.role === "admin"}
                      >
                        {u.role === "admin"
                          ? "Admin"
                          : promotingUserId === u.id
                          ? "Promoting..."
                          : "Promote"}
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
                          {(() => {
                            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              u.displayName ?? u.email ?? "User"
                            )}&background=eff6ff&color=2563eb&size=64`;
                            return (
                              <img
                                src={avatarUrl}
                                alt={u.displayName ?? u.email ?? "User avatar"}
                                className="h-10 w-10 rounded-lg border border-border"
                              />
                            );
                          })()}
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
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            u.role === "admin"
                              ? "border border-amber-300/60 bg-amber-100/80 text-amber-900"
                              : "border border-border bg-background text-muted-foreground"
                          }`}
                        >
                          {u.role ?? "user"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {u.createdAt?.toDate
                          ? u.createdAt.toDate().toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                            onClick={() => viewDetails(u.id)}
                          >
                            Details
                          </button>
                          <button
                            className="rounded-lg border border-primary/20 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => promoteToAdmin(u.id)}
                            disabled={promotingUserId === u.id || u.role === "admin"}
                          >
                            {u.role === "admin"
                              ? "Admin"
                              : promotingUserId === u.id
                              ? "Promoting..."
                              : "Promote"}
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
