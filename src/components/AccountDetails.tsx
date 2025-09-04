import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase-config";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      navigate("/", { replace: true });
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
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-gray-500 animate-pulse">Loading...</div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-red-500 p-4 rounded bg-red-50">{error}</div>
      </div>
    );
  if (!authUser)
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-gray-500 p-4">Not signed in</div>
      </div>
    );

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    authUser.displayName || "User"
  )}&background=eff6ff&color=0f172a&size=256`;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
            <aside className="w-full lg:w-72 flex flex-col items-center lg:items-start gap-4">
              <img
                src={avatarUrl}
                alt={authUser.displayName ?? "User avatar"}
                className="w-28 h-28 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="text-center lg:text-left">
                <div className="text-2xl font-semibold text-slate-900">
                  {authUser.displayName ?? profile?.displayName ?? "—"}
                </div>
              </div>

              <div className="w-full mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-center">
                    <div className="text-xs text-slate-400">Reviews</div>
                    <div className="text-sm font-medium text-slate-800">
                      {userReviews.length}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-center">
                    <div className="text-xs text-slate-400">Role</div>
                    <div className="text-sm font-medium text-slate-800">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
                          profile?.role === "admin"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {profile?.role ?? "user"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full mt-4 flex gap-3">
                {profile?.role === "admin" && (
                  <button
                    onClick={() => navigate("/adminPanel")}
                    className="flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-semibold transition"
                  >
                    Adm. Panel
                  </button>
                )}
                <button
                  onClick={handleClick}
                  className="flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold transition"
                >
                  Logout
                </button>
              </div>
            </aside>

            <main className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Account details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage your profile and see your recent activity.
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-sm text-slate-500">
                    Email
                    <div className="text-sm font-medium text-slate-900 break-words">
                      {authUser.email ?? profile?.email ?? "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-400">Display name</div>
                  <div className="text-sm font-medium text-slate-900 mt-1">
                    {authUser.displayName ?? profile?.displayName ?? "—"}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-400">Last Login</div>
                  <div className="text-sm font-medium text-slate-900 mt-1">
                    {profile?.lastLogin &&
                      profile.lastLogin.toDate().toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </div>
                </div>
              </div>

              <section className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Your reviews
                  </h3>
                  <div className="text-sm text-slate-500">
                    Showing {userReviews.length}
                  </div>
                </div>

                {userReviews.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-100 bg-white p-6 text-center text-slate-500">
                    You haven't posted any reviews yet.
                  </div>
                ) : (
                  <div
                    role="region"
                    aria-label="User reviews"
                    className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden"
                  >
                    <div
                      className={
                        "p-4 md:p-5 overflow-y-auto " +
                        "max-h-[60vh] md:max-h-[50vh] lg:max-h-[50vh] " +
                        "space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50"
                      }
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userReviews.map((review) => (
                          <div
                            key={review.id}
                            className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition"
                          >
                            <ReviewItem review={review} />
                          </div>
                        ))}
                      </div>
                    </div>
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
