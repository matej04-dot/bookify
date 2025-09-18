"use client";

import { useEffect, useState } from "react";
import { auth } from "../firebase-config";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";

const NavbarUser: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setShowMenu(false);
      router.replace("/");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.displayName || user.email || "User"
  )}`;

  return (
    <div className="relative z-50">
      <button
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg 
        bg-gray-800 hover:bg-gray-700 transition-all duration-200 ease-in-out
        border border-gray-700 hover:border-gray-600 shadow-sm"
        onClick={() => setShowMenu((v) => !v)}
      >
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-600"
        />
        <span className="hidden sm:inline font-medium text-sm sm:text-base text-gray-200">
          {user.displayName || user.email?.split("@")[0]}
        </span>
        <svg
          className={`w-4 h-4 ml-0.5 sm:ml-1 transition-transform duration-200 ${
            showMenu ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="#e5e7eb"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {showMenu && (
        <div
          className="absolute right-0 mt-1 w-56 sm:w-64 md:w-72 bg-gray-100 rounded-lg border border-gray-200 
        shadow-lg transform opacity-100 scale-100 transition-all duration-200 ease-in-out"
        >
          <div className="py-2">
            <button
              className="flex items-center w-full px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-50 
              hover:text-gray-900 transition-colors duration-150"
              onClick={() => {
                setShowMenu(false);
                router.push("/account");
              }}
            >
              <svg
                className="w-4 h-4 mr-2"
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
              Account details
            </button>
            <button
              className="flex items-center w-full px-3 sm:px-4 py-2 text-sm sm:text-base text-red-600 hover:bg-red-50 
              hover:text-red-700 transition-colors duration-150"
              onClick={handleLogout}
            >
              <svg
                className="w-4 h-4 mr-2"
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
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarUser;
