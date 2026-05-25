"use client";
import { useState, useRef } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useSettings } from "@/hooks/useSettings";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import type { Recipe } from "@/types/recipe";

type State = "idle" | "loading" | "suggest" | "error";

interface SuggestResult {
  id: string;
  reason: string;
}

export function AIPromptBar() {
  const { settings } = useSettings();
  const { recipes } = useUserRecipes();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<State>("idle");
  const [results, setResults] = useState<SuggestResult[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!settings.aiEnabled) return null;

  async function handleSubmit() {
    const q = prompt.trim();
    if (!q || state === "loading") return;
    setState("loading");
    setError("");
    setResults([]);

    try {
      const summaries = recipes.map(r => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        cuisine: r.cuisine,
        mealTimes: r.mealTimes,
        tags: r.tags,
        dietaryTags: r.dietaryTags,
      }));

      const res = await fetch("/api/recipes/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, recipes: summaries }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setState("error");
        return;
      }

      if (data.mode === "suggest") {
        setResults(data.results ?? []);
        setState("suggest");
      } else if (data.mode === "generate" && data.recipe) {
        setGeneratedRecipe(data.recipe);
        setState("idle");
      } else {
        setError("Unexpected response — try again.");
        setState("error");
      }
    } catch {
      setError("Network error — check your connection.");
      setState("error");
    }
  }

  function clear() {
    setPrompt("");
    setResults([]);
    setState("idle");
    setError("");
    inputRef.current?.focus();
  }

  const isBusy = state === "loading";

  return (
    <>
      <div className="space-y-2">
        <div className={`flex items-center gap-3 bg-parchment-200 border rounded-2xl px-4 py-3 transition-colors duration-200 ${
          isBusy ? "border-saffron-300" : "border-parchment-300 focus-within:border-saffron-400"
        }`}>
          <Sparkles
            size={15}
            className={`shrink-0 transition-colors ${isBusy ? "text-saffron-500 animate-pulse" : "text-ink-400"}`}
          />
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={e => { setPrompt(e.target.value); if (state !== "idle") setState("idle"); }}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="What are you craving?"
            disabled={isBusy}
            className="flex-1 bg-transparent text-sm text-ink-900 placeholder-ink-400 outline-none min-w-0"
          />
          <AnimatePresence mode="wait">
            {(prompt || results.length > 0 || state === "error") && !isBusy ? (
              <motion.button
                key="clear"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clear}
                className="shrink-0 text-ink-400 hover:text-ink-600 transition-colors"
              >
                <X size={14} />
              </motion.button>
            ) : null}
          </AnimatePresence>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isBusy}
            className="shrink-0 w-7 h-7 bg-saffron-500 rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-saffron-600 transition-all"
          >
            <ArrowRight size={13} className="text-white" />
          </button>
        </div>

        <AnimatePresence>
          {state === "suggest" && results.length > 0 && (
            <motion.div
              key="suggest"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 pt-1"
            >
              {results.map(result => {
                const recipe = recipes.find(r => r.id === result.id);
                if (!recipe) return null;
                return (
                  <Link
                    key={result.id}
                    href={`/recipes/${recipe.slug}`}
                    className="flex items-center gap-3 bg-parchment-200 border border-parchment-300 rounded-xl px-4 py-3 hover:bg-parchment-300 transition-colors group"
                  >
                    {recipe.heroImageUrl && (
                      <img
                        src={recipe.heroImageUrl}
                        alt=""
                        className="w-11 h-11 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{recipe.title}</p>
                      <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{result.reason}</p>
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-ink-400 group-hover:text-ink-700 transition-colors" />
                  </Link>
                );
              })}
            </motion.div>
          )}

          {state === "suggest" && results.length === 0 && (
            <motion.p
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-ink-400 px-1"
            >
              Nothing in your library matched — try a different prompt.
            </motion.p>
          )}

          {state === "error" && (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-500 px-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {generatedRecipe && (
        <ImportRecipeModal
          generatedDraft={generatedRecipe}
          onClose={() => { setGeneratedRecipe(null); setPrompt(""); }}
          onSave={saved => { setGeneratedRecipe(null); setPrompt(""); router.push(`/recipes/${saved.slug}`); }}
        />
      )}
    </>
  );
}
