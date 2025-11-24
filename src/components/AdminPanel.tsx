"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase-config";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

  useEffect(() => {
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
  }, []);

  const promoteToAdmin = async (userId: string) => {
    if (!userId) return;
    const ok = confirm("Promote this user to admin?");
    if (!ok) return;
    try {
      const ref = doc(db, "users", userId);
      await updateDoc(ref, { role: "admin", updatedAt: serverTimestamp() });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: "admin" } : u))
      );
    } catch (err) {
      console.error("Failed to promote user:", err);
      alert("Failed to promote user. Check console for details.");
    }
  };

  const viewDetails = (userId: string) => {
    if (!userId) return;
    router.push(`/admin/users/${encodeURIComponent(userId)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage users and permissions
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-blue-600 
                       text-blue-600 rounded-xl font-semibold hover:bg-blue-50 
                       transition-all duration-200 shadow-md hover:shadow-lg"
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
              Home
            </button>
          </div>

          <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-blue-600">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="font-semibold">Total Users:</span>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              {users.length}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
              <p className="text-gray-600 font-medium">Loading users...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Mobile Cards */}
            <div className="lg:hidden grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {users.length === 0 && (
                <div className="col-span-full p-12 text-center bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300">
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
                  <p className="text-gray-600 font-medium">No users found</p>
                </div>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden 
                           hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          u.displayName ?? u.email ?? "User"
                        )}&background=FFFFFF&color=2563EB&size=128`;
                        return (
                          <img
                            src={avatarUrl}
                            alt={u.displayName ?? u.email ?? "User avatar"}
                            className="h-14 w-14 rounded-full border-2 border-white shadow-lg"
                          />
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-lg truncate">
                          {u.displayName ?? "Unknown"}
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            u.role === "admin"
                              ? "bg-amber-400 text-amber-900"
                              : "bg-white/20 text-white"
                          }`}
                        >
                          {u.role ?? "user"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="text-sm text-gray-600 break-words flex items-start gap-2">
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

                    <div className="text-xs text-gray-500 flex items-center gap-2">
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

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 
                                 text-gray-800 rounded-lg font-medium transition-colors"
                        onClick={() => viewDetails(u.id)}
                      >
                        View Details
                      </button>
                      <button
                        className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 
                                 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg 
                                 font-medium transition-all shadow-md"
                        onClick={() => promoteToAdmin(u.id)}
                      >
                        Promote
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
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
                        <p className="text-gray-500 font-medium">
                          No users found
                        </p>
                      </td>
                    </tr>
                  )}

                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-blue-50 transition-colors"
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
                                className="h-10 w-10 rounded-full border-2 border-blue-100 shadow-sm"
                              />
                            );
                          })()}
                          <div>
                            <div className="font-semibold text-gray-900">
                              {u.displayName ?? "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                              {u.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.email ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            u.role === "admin"
                              ? "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 border border-amber-300"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300"
                          }`}
                        >
                          {u.role ?? "user"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {u.createdAt?.toDate
                          ? u.createdAt.toDate().toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 
                                     text-gray-800 rounded-lg font-medium transition-colors"
                            onClick={() => viewDetails(u.id)}
                          >
                            Details
                          </button>
                          <button
                            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 
                                     hover:from-blue-700 hover:to-blue-800 text-white rounded-lg 
                                     font-medium transition-all shadow-md hover:shadow-lg"
                            onClick={() => promoteToAdmin(u.id)}
                          >
                            Promote
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
