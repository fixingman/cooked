import Link from "next/link";
import { Flame } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-parchment-100">
      <div className="w-16 h-16 bg-saffron-500 rounded-2xl flex items-center justify-center mb-6">
        <Flame size={28} className="text-white" strokeWidth={2.5} />
      </div>
      <h1 className="font-display text-4xl font-semibold text-ink-900 mb-2">Page not found</h1>
      <p className="text-ink-500 text-base mb-8 max-w-xs">
        This page doesn&apos;t exist, or the recipe may have been removed.
      </p>
      <div className="flex gap-3">
        <Link
          href="/recipes"
          className="px-5 py-2.5 bg-saffron-500 text-white rounded-xl text-sm font-medium hover:bg-saffron-600 transition-colors"
        >
          Browse recipes
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 bg-parchment-200 text-ink-700 rounded-xl text-sm font-medium hover:bg-parchment-300 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
