"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { logoutCurrentUser, subscribeToAuthChanges } from "../firebase-config";
import { type User } from "firebase/auth";
import { useRouter } from "next/navigation";

const getInitials = (value: string) => {
  const base = value.includes("@") ? value.split("@")[0] : value;
  const parts = base.split(/[\s._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase() || "U";
};

const NavbarUser: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
      setLoading(false);
      setAvatarLoadFailed(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutCurrentUser();
    } catch {
    } finally {
      setShowMenu(false);
      router.replace("/");
    }
  };

  if (loading)
    return (
      <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
    );
  if (!user) return null;

  const userLabel = user.displayName || user.email || "User";
  const userInitials = getInitials(userLabel);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userLabel,
  )}&background=2563eb&color=ffffff&bold=true&size=128`;

  return (
    <div className="relative z-50">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg 
        bg-gray-100 hover:bg-gray-200 transition-all duration-200
        border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
        onClick={() => setShowMenu((v) => !v)}
        aria-label="User menu"
      >
        {avatarLoadFailed ? (
          <div className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {userInitials}
          </div>
        ) : (
          <Image
            src={avatarUrl}
            alt="User avatar"
            width={32}
            height={32}
            unoptimized
            onError={() => setAvatarLoadFailed(true)}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        )}
        <span className="hidden md:inline font-semibold text-sm text-gray-700">
          {user.displayName || user.email?.split("@")[0]}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 hidden md:block ${
            showMenu ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
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
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 
          shadow-2xl z-50 overflow-hidden"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <div className="flex items-center gap-3">
                {avatarLoadFailed ? (
                  <div className="w-12 h-12 rounded-full ring-2 ring-blue-200 shadow-sm bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                    {userInitials}
                  </div>
                ) : (
                  <Image
                    src={avatarUrl}
                    alt="User avatar"
                    width={48}
                    height={48}
                    unoptimized
                    onError={() => setAvatarLoadFailed(true)}
                    className="w-12 h-12 rounded-full ring-2 ring-blue-200 shadow-sm"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 
                hover:text-blue-700 transition-colors duration-150 font-medium group"
                onClick={() => {
                  setShowMenu(false);
                  router.push("/account");
                }}
              >
                <svg
                  className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-600"
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
                My Account
              </button>

              <div className="border-t border-gray-100 my-1"></div>

              <button
                className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 
                hover:text-red-700 transition-colors duration-150 font-medium group"
                onClick={handleLogout}
              >
                <svg
                  className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-600"
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
        </>
      )}
    </div>
  );
};

export default NavbarUser;
