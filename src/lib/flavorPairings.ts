import { readFileSync } from "fs";
import path from "path";

// Module-level cache — persists across warm Lambda invocations
let names: (string | null)[] | null = null; // index = node_id
let vecs: (Float32Array | null)[] | null = null; // pre-normalized, index = node_id
let nameIndex: Map<string, number> | null = null;

function load() {
  if (vecs) return;

  const dir = path.join(process.cwd(), "src/data/flavor");

  // ── Ingredient list ──────────────────────────────────────────────────────────
  const listLines = readFileSync(path.join(dir, "ingredient_list.csv"), "utf8")
    .trim().split("\n").slice(1);

  let maxId = 0;
  for (const line of listLines) {
    const id = parseInt(line);
    if (id > maxId) maxId = id;
  }

  names = new Array(maxId + 1).fill(null);
  nameIndex = new Map();

  for (const line of listLines) {
    const comma = line.indexOf(",");
    const id = parseInt(line.slice(0, comma));
    const rest = line.slice(comma + 1);
    const name = rest.slice(0, rest.indexOf(","));
    names[id] = name;
    nameIndex.set(name, id);
  }

  // ── Embeddings ───────────────────────────────────────────────────────────────
  const embLines = readFileSync(path.join(dir, "embeddings.csv"), "utf8")
    .trim().split("\n").slice(1);

  vecs = new Array(maxId + 1).fill(null);

  for (const line of embLines) {
    const parts = line.split(",");
    const id = parseInt(parts[0]);
    const v = new Float32Array(300);
    for (let i = 0; i < 300; i++) v[i] = parseFloat(parts[i + 1]);

    // Normalize to unit length so cosine similarity = dot product
    let norm = 0;
    for (let i = 0; i < 300; i++) norm += v[i] * v[i];
    norm = Math.sqrt(norm);
    if (norm > 0) for (let i = 0; i < 300; i++) v[i] /= norm;

    vecs[id] = v;
  }
}

function toKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function resolveId(ingredient: string): number | null {
  load();
  const idx = nameIndex!;
  const key = toKey(ingredient);

  if (idx.has(key)) return idx.get(key)!;

  // First word: "chicken breast" → "chicken"
  const first = key.split("_")[0];
  if (first !== key && idx.has(first)) return idx.get(first)!;

  // Last word: "fresh_basil" → "basil"
  const parts = key.split("_");
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (idx.has(last)) return idx.get(last)!;
  }

  return null;
}

/** Top-K cosine neighbors for one ingredient (excluding itself). */
export function getNeighbors(ingredient: string, k = 6): string[] {
  load();
  const id = resolveId(ingredient);
  if (id == null || !vecs![id]) return [];

  const q = vecs![id];
  const scores: [number, number][] = [];

  for (let i = 1; i < vecs!.length; i++) {
    const v = vecs![i];
    if (i === id || !v) continue;
    let dot = 0;
    for (let d = 0; d < 300; d++) dot += q[d] * v[d];
    scores.push([dot, i]);
  }

  scores.sort((a, b) => b[0] - a[0]);

  return scores
    .slice(0, k)
    .map(([, i]) => names![i]?.replace(/_/g, " ") ?? "")
    .filter(Boolean);
}

/** Pairing suggestions for a set of pantry ingredients.
 *  Each entry's suggestions exclude the other pantry items. */
export function getPairings(
  ingredients: string[],
  topK = 6
): { ingredient: string; suggests: string[] }[] {
  const pantryKeys = new Set(ingredients.map(toKey));

  return ingredients
    .map(ing => {
      const raw = getNeighbors(ing, topK + ingredients.length);
      const suggests = raw
        .filter(s => !pantryKeys.has(toKey(s)))
        .slice(0, topK);
      return { ingredient: ing, suggests };
    })
    .filter(p => p.suggests.length > 0);
}
