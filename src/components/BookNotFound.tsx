"use client";

export default function BookNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Book Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          We couldn&apos;t load the details for this book. The service might be
          temporarily unavailable.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                     rounded-xl font-semibold shadow-lg hover:shadow-xl 
                     transition-all duration-200 hover:scale-105"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 
                     rounded-xl font-semibold shadow-lg hover:shadow-xl 
                     transition-all duration-200 hover:scale-105"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
