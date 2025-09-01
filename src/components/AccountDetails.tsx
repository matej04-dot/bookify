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
      <div className="text-gray-500 flex justify-center p-4">Loading...</div>
    );
  if (error)
    return <div className="text-red-500 flex justify-center p-4">{error}</div>;
  if (!authUser)
    return (
      <div className="text-gray-500 flex justify-center p-4">Not signed in</div>
    );

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    authUser.displayName || "User"
  )}`;

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row border border-gray-300 justify-between bg-gray-100 rounded-lg shadow-md max-w-lg mx-auto p-3 mb-3 gap-4 md:gap-0">
        <div className="flex flex-col sm:flex-row items-center">
          <img
            src={avatarUrl}
            alt="User Avatar"
            className="w-22 h-22 sm:w-26 sm:h-26 rounded-full"
          />
          <div className="mt-3 sm:mt-0 sm:ml-6 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 break-words">
              {authUser.displayName ?? profile?.displayName ?? "—"}
            </h2>
            {profile?.createdAt && (
              <p className="text-gray-500 text-sm mt-1">
                <strong className="font-medium text-gray-700">Joined:</strong>{" "}
                {profile.createdAt?.toDate
                  ? profile.createdAt.toDate().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : String(profile.createdAt)}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-center">
          {profile?.role === "admin" && (
            <button
              type="button"
              className="text-md mb-3 h-10 w-full md:w-22 rounded-lg bg-blue-300 border border-blue-400 hover:bg-blue-400 text-gray-800 font-semibold transition"
              onClick={() => navigate("/adminPanel")}
            >
              Admin
            </button>
          )}
          <button
            type="button"
            className="text-md h-10 w-full md:w-22 rounded-lg bg-red-400 border border-red-500 hover:bg-red-500 text-gray-800 font-semibold transition"
            onClick={handleClick}
          >
            Logout
          </button>
        </div>
      </div>
      <div>
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-200">
            <span className="font-semibold text-gray-700 w-full sm:w-28 mb-1 sm:mb-0">
              Email:
            </span>
            <span className="text-gray-800 break-all">
              {authUser.email ?? profile?.email ?? "—"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-200">
            <span className="font-semibold text-gray-700 w-full sm:w-28 mb-1 sm:mb-0">
              Last Login:
            </span>
            <span className="text-gray-800">
              {profile?.lastLogin?.toDate
                ? profile.lastLogin.toDate().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </span>
          </div>
          <div>
            {userReviews.length === 0 ? (
              <div className="text-center text-gray-500 m-2">
                No reviews found
              </div>
            ) : (
              userReviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
