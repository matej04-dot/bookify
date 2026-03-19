"use client";

import Search from "./Search";
import NavbarUser from "./NavbarUser";
import { useEffect, useState } from "react";
import { subscribeToAuthChanges } from "../firebase-config";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [fromPath, setFromPath] = useState<string>("/");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFromPath(window.location.pathname);

      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/92 backdrop-blur-xl shadow-sm border-b border-slate-200"
          : "bg-white/98 border-b border-slate-100"
      }`}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
            <div className="flex flex-col">
              <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                bookify
              </span>
              <span className="text-xs text-gray-500 -mt-1">
                Reviews and reading intelligence
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-2xl mx-8">
            <Search />
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <NavbarUser />
            ) : (
              <Link
                href={{
                  pathname: "/login",
                  query: { from: fromPath },
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-600 px-5 py-2.5 text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
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
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-3">
            {/* Mobile Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                bookify
              </span>
            </Link>

            {/* Mobile User Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <NavbarUser />
              ) : (
                <Link
                  href={{
                    pathname: "/login",
                    query: { from: fromPath },
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="pb-3">
            <Search />
          </div>
        </div>
      </div>
    </nav>
  );
}
