"use client";

import Search from "./Search";
import { useRouter } from "next/navigation";
import NavbarUser from "./NavbarUser";
import { useEffect, useState } from "react";
import { auth } from "../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-3 bg-gray-900">
      <div className="flex justify-between items-center mb-1">
        <Link
          href="/"
          className="p-2 text-4xl font-light text-gray-200 tracking-wider"
        >
          bookify
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <NavbarUser />
          ) : (
            <button
              onClick={() =>
                router.push("/login", {
                  query: { from: window.location.pathname },
                })
              }
              className="bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-lg px-6 py-2 flex items-center justify-center font-semibold text-gray-900 hover:from-yellow-400 hover:to-yellow-500 hover:border-gray-700"
            >
              Login
            </button>
          )}
        </div>
      </div>
      <div className="flex w-full justify-center items-center">
        <Search />
      </div>
    </div>
  );
}
