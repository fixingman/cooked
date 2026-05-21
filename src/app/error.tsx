"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-parchment-100">
      <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-2">Something went wrong</h1>
      <p className="text-ink-500 text-sm mb-8 max-w-xs">
        An unexpected error occurred. Your recipes are safe — try refreshing the page.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-saffron-500 text-white rounded-xl text-sm font-medium hover:bg-saffron-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
