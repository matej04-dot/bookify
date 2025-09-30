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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-2xl lg:text-3xl font-semibold text-gray-900">
            Admin Panel
          </h1>
          <div className="text-sm text-gray-600">
            <span className="hidden sm:inline">Manage users</span>
          </div>
        </div>

        {loading && <div className="text-gray-500">Loading users...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="lg:hidden grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {users.length === 0 && (
                <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow">
                  No users found
                </div>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
                  role="group"
                >
                  <div className="p-5 flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {(() => {
                        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          u.displayName ?? u.email ?? "User"
                        )}&background=F3F4F6&color=111827&size=128`;
                        return (
                          <img
                            src={avatarUrl}
                            alt={u.displayName ?? u.email ?? "User avatar"}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        );
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm md:text-base font-medium text-gray-900">
                          {u.displayName ?? "—"}
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : u.role === "moderator"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {u.role ?? "user"}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-gray-600 break-words">
                        {u.email ?? "—"}
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        Joined:{" "}
                        {u.createdAt?.toDate
                          ? u.createdAt.toDate().toLocaleString()
                          : u.createdAt
                          ? String(u.createdAt)
                          : "—"}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded border border-gray-200"
                          onClick={() => viewDetails(u.id)}
                          title="View details"
                        >
                          Details
                        </button>
                        <button
                          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-600 shadow-sm"
                          onClick={() => promoteToAdmin(u.id)}
                          title="Promote to admin"
                        >
                          Promote
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block bg-white rounded-lg shadow overflow-x-auto border border-gray-100">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      UID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No users found
                      </td>
                    </tr>
                  )}

                  {users.map((u, idx) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors"
                      aria-rowindex={idx + 1}
                    >
                      <td className="px-6 py-4 align-top max-w-xs break-all text-sm text-gray-700">
                        {u.id}
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-gray-900 font-medium">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              u.displayName ?? u.email ?? "User"
                            )}&background=F3F4F6&color=111827&size=64`;
                            return (
                              <img
                                src={avatarUrl}
                                alt={u.displayName ?? u.email ?? "User avatar"}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            );
                          })()}
                          <span>{u.displayName ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-gray-600 break-words">
                        {u.email ?? "—"}
                      </td>
                      <td className="px-6 py-4 align-top text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {u.role ?? "user"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-gray-500">
                        {u.createdAt?.toDate
                          ? u.createdAt.toDate().toLocaleString()
                          : u.createdAt
                          ? String(u.createdAt)
                          : "—"}
                      </td>
                      <td className="px-6 py-4 align-top text-right text-sm">
                        <div className="inline-flex items-center gap-3">
                          <button
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded border border-gray-200"
                            onClick={() => viewDetails(u.id)}
                            title="View details"
                          >
                            Details
                          </button>
                          <button
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-600 shadow-sm"
                            onClick={() => promoteToAdmin(u.id)}
                            title="Promote to admin"
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
