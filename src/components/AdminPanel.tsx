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

  return (
    <div className="p-4 font-sans text-gray-900">
      <h1 className="text-2xl font-semibold mb-6">Admin Panel — Users</h1>

      {loading && <div className="text-gray-500">Loading users...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          <div className="md:hidden grid gap-3">
            {users.length === 0 && (
              <div className="p-4 text-center text-gray-500 bg-white rounded shadow">
                No users found
              </div>
            )}
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-lg shadow-sm border overflow-hidden"
                role="group"
              >
                <div className="p-4 sm:p-5 flex items-start gap-4">
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
                      <div className="text-sm font-medium text-gray-800">
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
                    <div className="mt-3 flex gap-2">
                      <button
                        className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded border border-blue-600 shadow-sm"
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

          <div className="hidden md:block bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    UID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-500"
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
                    <td className="px-4 py-3 align-top max-w-xs break-all text-sm text-gray-700">
                      {u.id}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-gray-800 font-medium">
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
                    <td className="px-4 py-3 align-top text-sm text-gray-600 break-words">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-sm">
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
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-gray-500">
                      {u.createdAt?.toDate
                        ? u.createdAt.toDate().toLocaleString()
                        : u.createdAt
                        ? String(u.createdAt)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-right text-sm">
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded border border-blue-600 shadow-sm"
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
  );
}

export default AdminPanel;
