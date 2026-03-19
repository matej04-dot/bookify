"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";

  const shouldHideLayout =
    pathname === "/login" ||
    pathname === "/admin" ||
    pathname === "/account" ||
    pathname.startsWith("/admin/users/") ||
    pathname.startsWith("/account/");

  if (shouldHideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
