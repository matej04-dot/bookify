"use client";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-center text-sm text-gray-600 py-4 border-t mt-auto">
      <p>© {new Date().getFullYear()} Bookify. All rights reserved.</p>
    </footer>
  );
}
