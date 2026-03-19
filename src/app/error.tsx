"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-600 mb-5">
          We hit an unexpected issue while loading this page. Please try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
