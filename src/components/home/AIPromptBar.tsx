"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Loader2, Archive, ChevronRight, WandSparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserRecipes } from "@/hooks/useUserRecipes";
import { useSettings } from "@/hooks/useSettings";
import { usePantry } from "@/hooks/usePantry";
import { normalizeForMatch } from "@/lib/ingredientUtils";
import { GeneratedRecipeModal } from "@/components/home/GeneratedRecipeModal";
import type { Recipe } from "@/types/recipe";

type State = "idle" | "loading" | "suggest" | "pairing" | "concepts" | "error";

interface SuggestResult {
  id: string;
  reason: string;
}

interface Concept {
  title: string;
  description: string;
}

interface Pairing {
  ingredient: string;
  suggests: string[];
}

const EXAMPLE_PROMPTS = [
  "Something quick with chicken",
  "Vegetarian comfort food",
  "Impress guests on a Sunday",
];

export function AIPromptBar() {
  const { settings } = useSettings();
  const { recipes } = useUserRecipes();
  const { items: pantryItems } = usePantry();
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<State>("idle");
  const [results, setResults] = useState<SuggestResult[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !settings.aiEnabled) return null;

  const hasPantry = pantryItems.length > 0;
  const isBusy = state === "loading";

  // ── Suggest / generate flow ────────────────────────────────────────────────

  async function handleSubmit(overridePrompt?: string, pantryCtx?: { pantryItems: string[]; flavorHints: Record<string, string[]> }, forceGenerate?: boolean) {
    const q = (overridePrompt ?? prompt).trim();
    if (!q || state === "loading") return;
    setState("loading");
    setError("");
    setResults([]);

    const summaries = recipes.map(r => ({
      id: r.id, slug: r.slug, title: r.title, description: r.description,
      cuisine: r.cuisine, mealTimes: r.mealTimes, tags: r.tags, dietaryTags: r.dietaryTags,
    }));

    try {
      const res = await fetch("/api/recipes/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, recipes: summaries, ...(forceGenerate ? { forceGenerate: true } : {}), ...pantryCtx }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? "Something went wrong."); setState("error"); return; }

      if (data.mode === "suggest") {
        setResults(data.results ?? []);
        setState("suggest");
      } else if (data.mode === "generate" && data.recipe) {
        setGeneratedRecipe(data.recipe);
        setState("idle");
      } else {
        setError("Unexpected response — try again."); setState("error");
      }
    } catch {
      setError("Network error — check your connection."); setState("error");
    }
  }

  // ── Concept picker — fast Haiku call to show 3 options before full generation
  async function handleGenerateConcepts(overridePrompt?: string) {
    const q = (overridePrompt ?? prompt).trim();
    if (!q || state === "loading") return;
    setState("loading");
    setError("");
    setConcepts([]);
    try {
      const res = await fetch("/api/recipes/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, recipes: [], conceptsOnly: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setState("error"); return; }
      if (data.mode === "concepts" && Array.isArray(data.concepts)) {
        setConcepts(data.concepts);
        setState("concepts");
      } else {
        setError("Unexpected response — try again."); setState("error");
      }
    } catch {
      setError("Network error — check your connection."); setState("error");
    }
  }

  async function handleSelectConcept(concept: Concept) {
    setState("loading");
    setConcepts([]);
    // Enrich the prompt with the chosen concept so generation stays on target.
    const enriched = `${prompt.trim()} — make specifically: ${concept.title}. ${concept.description}`;
    await handleSubmit(enriched, undefined, true);
  }

  // ── "Use what I have" — load pairings, show pairing panel ─────────────────

  async function handleUsePantry() {
    setState("loading");
    const names = pantryItems.map(i => normalizeForMatch(i.name));

    try {
      const res = await fetch("/api/flavor/pairings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: names }),
      });
      const data = await res.json();
      const ps: Pairing[] = data.pairings ?? [];
      setPairings(ps);

      // Pre-select all suggestions
      const allSuggests = new Set(ps.flatMap(p => p.suggests));
      setSelected(allSuggests);

      setState("pairing");
    } catch {
      // Fallback: skip pairing panel, go straight to generate
      const pantryNames = pantryItems.map(i => i.name);
      handleSubmit(`I have: ${pantryNames.join(", ")}. What should I make?`);
    }
  }

  function toggleChip(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) { next.delete(name); } else { next.add(name); }
      return next;
    });
  }

  function handleGenerateFromPantry() {
    const pantryNames = pantryItems.map(i => i.name);
    const flavorHints: Record<string, string[]> = {};
    for (const p of pairings) {
      const hits = p.suggests.filter(s => selected.has(s));
      if (hits.length) flavorHints[p.ingredient] = hits;
    }
    const q = `I have: ${pantryNames.join(", ")}. Make something delicious.`;
    setPairings([]);
    setSelected(new Set());
    handleSubmit(q, { pantryItems: pantryNames, flavorHints });
  }

  function clear() {
    setPrompt(""); setResults([]); setPairings([]); setSelected(new Set()); setConcepts([]);
    setState("idle"); setError("");
    inputRef.current?.focus();
  }

  const showExamples = state === "idle" && !prompt && !results.length;
  const showClear = (prompt || results.length > 0 || state === "error" || state === "pairing" || state === "concepts") && !isBusy;

  return (
    <>
      <div className="space-y-2">
        {/* Input row */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {isBusy
              ? <Loader2 size={15} className="text-saffron-500 animate-spin" />
              : <Sparkles size={15} className="text-ink-400" />
            }
          </span>
          <input
            ref={inputRef}
            type="text"
            value={isBusy ? "" : prompt}
            onChange={e => { setPrompt(e.target.value); if (state !== "idle") setState("idle"); }}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
            placeholder={isBusy ? "Thinking…" : "What are you craving?"}
            disabled={isBusy}
            className={`w-full pl-10 pr-9 py-3 bg-parchment-200 border rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-parchment-100 transition-all duration-200 ${
              isBusy ? "border-saffron-300 placeholder:animate-pulse" : "border-parchment-300 focus:border-saffron-400"
            }`}
          />
          {showClear && (
            <button onClick={clear} className="absolute right-3 inset-y-0 my-auto flex items-center justify-center w-6 h-6 rounded-full text-ink-400 hover:text-ink-700 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Example prompts — shown when idle + empty */}
        <AnimatePresence>
          {showExamples && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="flex flex-wrap gap-2"
            >
              {hasPantry && (
                <button
                  onClick={handleUsePantry}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-parchment-300 bg-parchment-200 text-ink-600 hover:bg-parchment-300 transition-colors"
                >
                  <Archive size={12} className="text-sage-500" />
                  Use what I have
                </button>
              )}
              <button
                onClick={() => {
                  const q = prompt.trim() || "Surprise me with something delicious";
                  setPrompt(q);
                  handleGenerateConcepts(q);
                }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-saffron-300 bg-saffron-50 text-saffron-700 hover:bg-saffron-100 transition-colors"
              >
                <WandSparkles size={12} />
                Create new recipe
              </button>
              {EXAMPLE_PROMPTS.map(ex => (
                <button
                  key={ex}
                  onClick={() => { setPrompt(ex); handleSubmit(ex); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-parchment-300 bg-parchment-200 text-ink-500 hover:bg-parchment-300 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {/* Suggest results */}
          {state === "suggest" && results.length > 0 && (
            <motion.div key="suggest" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-2 pt-1">
              {results.map(result => {
                const recipe = recipes.find(r => r.id === result.id);
                if (!recipe) return null;
                return (
                  <Link key={result.id} href={`/recipes/${recipe.slug}`} className="flex items-center gap-3 bg-parchment-200 border border-parchment-300 rounded-xl px-4 py-3 hover:bg-parchment-300 transition-colors group">
                    {recipe.heroImageUrl && (
                      <Image src={recipe.heroImageUrl} alt="" width={44} height={44} className="rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{recipe.title}</p>
                      <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{result.reason}</p>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-ink-400 group-hover:text-ink-700 transition-colors" />
                  </Link>
                );
              })}
              <button
                onClick={() => handleGenerateConcepts(prompt)}
                className="flex items-center gap-1.5 text-xs text-saffron-600 hover:text-saffron-700 transition-colors px-1 pt-1"
              >
                <WandSparkles size={12} />
                Generate a new recipe instead →
              </button>
            </motion.div>
          )}

          {state === "suggest" && results.length === 0 && (
            <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between px-1">
              <p className="text-xs text-ink-400">Nothing in your library matched.</p>
              <button
                onClick={() => handleGenerateConcepts(prompt)}
                className="flex items-center gap-1.5 text-xs text-saffron-600 hover:text-saffron-700 transition-colors"
              >
                <WandSparkles size={12} />
                Generate new recipe →
              </button>
            </motion.div>
          )}

          {/* Concept picker */}
          {state === "concepts" && concepts.length > 0 && (
            <motion.div key="concepts" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-2 pt-1">
              <p className="text-xs text-ink-400 px-1">Pick one to make →</p>
              {concepts.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectConcept(c)}
                  className="w-full text-left bg-parchment-200 border border-parchment-300 rounded-xl px-4 py-3 hover:bg-parchment-300 hover:border-saffron-300 transition-colors group"
                >
                  <p className="text-sm font-medium text-ink-900 group-hover:text-ink-900">{c.title}</p>
                  <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{c.description}</p>
                </button>
              ))}
            </motion.div>
          )}

          {/* Pairing panel */}
          {state === "pairing" && pairings.length > 0 && (
            <motion.div key="pairing" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-3 pt-1">
              <p className="text-xs text-ink-500 px-1">Based on flavour science, these pair well with your pantry:</p>
              {pairings.map(p => (
                <div key={p.ingredient} className="space-y-1.5">
                  <p className="text-[11px] text-ink-400 uppercase tracking-widest">Your {p.ingredient}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.suggests.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleChip(s)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          selected.has(s)
                            ? "bg-ink-900 text-parchment-100 border-ink-900"
                            : "bg-parchment-200 text-ink-500 border-parchment-300 hover:bg-parchment-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={handleGenerateFromPantry}
                className="w-full bg-saffron-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-saffron-600 transition-colors"
              >
                Generate with these →
              </button>
            </motion.div>
          )}

          {/* Error */}
          {state === "error" && (
            <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-500 px-1">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Generated recipe modal */}
      <AnimatePresence>
        {generatedRecipe && (
          <GeneratedRecipeModal
            draft={generatedRecipe}
            onClose={() => { setGeneratedRecipe(null); setPrompt(""); }}
            onSave={saved => { setGeneratedRecipe(null); setPrompt(""); router.push(`/recipes/${saved.slug}`); }}
            onRegenerate={() => {
              setGeneratedRecipe(null);
              handleGenerateConcepts(prompt);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
