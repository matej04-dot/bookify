"use client";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-100 via-white to-blue-100 border-t shadow-inner mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-700 text-lg">bookify</span>
          <span className="hidden md:inline text-gray-400">|</span>
          <span className="text-gray-500 text-sm">
            Discover. Review. Share.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-blue-600 transition"
            aria-label="GitHub"
          >
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.93.58.11.79-.25.79-.56v-2.01c-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.75-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.45.11-3.02 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99.01 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.57.23 2.73.11 3.02.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.41-5.27 5.7.42.36.8 1.09.8 2.2v3.26c0 .31.21.67.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z" />
            </svg>
          </a>
          <a
            href="mailto:info@bookify.com"
            className="text-gray-500 hover:text-blue-600 transition text-sm"
          >
            Kontakt
          </a>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 py-2 border-t">
        © {new Date().getFullYear()} bookify. All rights reserved.
      </div>
    </footer>
  );
}
