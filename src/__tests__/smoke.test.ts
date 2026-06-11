/**
 * Smoke tests — regression guards for the core parser + import utilities.
 * Each test is named after the bug/behaviour it protects.
 */

import { describe, it, expect } from "vitest";
import { buildRecipeFromSchema, parseRecipeFromHtml } from "@/lib/parseJsonLd";
import { isYouTubeUrl, extractVideoId } from "@/lib/youtubeImport";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function schema(overrides: Record<string, unknown>) {
  return {
    name: "Test Recipe",
    recipeYield: "4",
    recipeIngredient: [] as string[],
    recipeInstructions: [] as unknown[],
    ...overrides,
  };
}

function build(overrides: Record<string, unknown>) {
  return buildRecipeFromSchema(schema(overrides), "https://example.com", "test-id");
}

// ---------------------------------------------------------------------------
// parseServings — descriptive yield strings
// ---------------------------------------------------------------------------

describe("parseServings", () => {
  it("extracts number from 'Cuts into 10 slices'", () => {
    expect(build({ recipeYield: "Cuts into 10 slices" }).servings).toBe(10);
  });

  it("extracts number from 'Makes 20'", () => {
    expect(build({ recipeYield: "Makes 20" }).servings).toBe(20);
  });

  it("handles plain numeric string", () => {
    expect(build({ recipeYield: "8" }).servings).toBe(8);
  });

  it("handles numeric value", () => {
    expect(build({ recipeYield: 24 }).servings).toBe(24);
  });

  it("handles array yield ['4 servings']", () => {
    expect(build({ recipeYield: ["4 servings"] }).servings).toBe(4);
  });

  it("returns 0 for missing yield", () => {
    expect(build({ recipeYield: undefined }).servings).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseMixedNumber — unicode fraction characters
// ---------------------------------------------------------------------------

describe("parseMixedNumber (via ingredient quantities)", () => {
  it("parses '1½ cups flour' as 1.5", () => {
    const r = build({ recipeIngredient: ["1½ cups flour"] });
    expect(r.ingredients[0].quantity).toBe(1.5);
  });

  it("parses '2¾ tsp salt' as 2.75", () => {
    const r = build({ recipeIngredient: ["2¾ tsp salt"] });
    expect(r.ingredients[0].quantity).toBe(2.75);
  });

  it("parses '½ cup sugar' as 0.5", () => {
    const r = build({ recipeIngredient: ["½ cup sugar"] });
    expect(r.ingredients[0].quantity).toBe(0.5);
  });

  it("parses '1 ½ cups milk' (space-separated) as 1.5", () => {
    const r = build({ recipeIngredient: ["1 ½ cups milk"] });
    expect(r.ingredients[0].quantity).toBe(1.5);
  });

  it("parses '1/2 cup butter' as 0.5", () => {
    const r = build({ recipeIngredient: ["1/2 cup butter"] });
    expect(r.ingredients[0].quantity).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// splitInstructionString — recipeInstructions as HTML string (Food Network)
// ---------------------------------------------------------------------------

describe("splitInstructionString (recipeInstructions as string)", () => {
  it("splits numbered HTML string into steps", () => {
    const r = build({
      recipeInstructions: "1) Mix flour and eggs.<br><br>2) Bake for 30 min.",
    });
    expect(r.steps.length).toBe(2);
    expect(r.steps[0].instruction).toContain("Mix flour");
    expect(r.steps[1].instruction).toContain("Bake");
  });

  it("splits on double-newline when no numbering", () => {
    const r = build({
      recipeInstructions: "Mix all ingredients.\n\nBake for 30 min.\n\nCool and serve.",
    });
    expect(r.steps.length).toBe(3);
  });

  it("handles 'Step 1:' prefix style", () => {
    const r = build({
      recipeInstructions: "Step 1: Preheat oven.\nStep 2: Mix ingredients.",
    });
    expect(r.steps.length).toBe(2);
  });

  it("falls back to single step for unparseable string", () => {
    const r = build({ recipeInstructions: "Mix everything and bake." });
    expect(r.steps.length).toBe(1);
  });

  it("returns empty steps for missing instructions", () => {
    const r = build({ recipeInstructions: undefined });
    expect(r.steps.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// JSON-LD @graph unwrapping (Serious Eats / schema.org pattern)
// ---------------------------------------------------------------------------

describe("parseRecipeFromHtml — @graph unwrapping", () => {
  it("finds Recipe inside @graph array", () => {
    const html = `<script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[
        {"@type":"WebPage","name":"Test"},
        {"@type":"Recipe","name":"Graph Recipe","recipeIngredient":["1 egg"],"recipeInstructions":[{"@type":"HowToStep","text":"Boil the egg."}]}
      ]}
    </script>`;
    const recipe = parseRecipeFromHtml(html, "https://seriouseats.com/test", "id");
    expect(recipe).not.toBeNull();
    expect(recipe!.title).toBe("Graph Recipe");
    expect(recipe!.steps.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Barefootcontessa.com — all ingredients in one \n-delimited string
// ---------------------------------------------------------------------------

describe("flatMap ingredient splitting", () => {
  it("splits single \\n-delimited ingredient string into separate ingredients", () => {
    const r = build({
      recipeIngredient: ["225g butter\n225g sugar\n4 eggs"],
    });
    expect(r.ingredients.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Dietary tags — schema.org URL format (BBC Good Food)
// ---------------------------------------------------------------------------

describe("mapDietaryTags", () => {
  it("handles full schema.org URL for VegetarianDiet", () => {
    const r = build({ suitableForDiet: "https://schema.org/VegetarianDiet" });
    expect(r.dietaryTags).toContain("vegetarian");
  });

  it("handles plain string 'VeganDiet'", () => {
    const r = build({ suitableForDiet: "VeganDiet" });
    expect(r.dietaryTags).toContain("vegan");
  });

  it("handles array of diet tags", () => {
    const r = build({ suitableForDiet: ["VegetarianDiet", "GlutenFreeDiet"] });
    expect(r.dietaryTags).toContain("vegetarian");
    expect(r.dietaryTags).toContain("gluten-free");
  });
});

// ---------------------------------------------------------------------------
// isYouTubeUrl + extractVideoId
// ---------------------------------------------------------------------------

describe("isYouTubeUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/shorts/abc123",
  ])("recognises %s as YouTube", (url) => {
    expect(isYouTubeUrl(new URL(url))).toBe(true);
  });

  it.each([
    "https://www.bbcgoodfood.com/recipes/test",
    "https://vimeo.com/123456",
  ])("rejects %s as non-YouTube", (url) => {
    expect(isYouTubeUrl(new URL(url))).toBe(false);
  });
});

describe("extractVideoId", () => {
  it("extracts from /watch?v=", () => {
    expect(extractVideoId(new URL("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))).toBe("dQw4w9WgXcQ");
  });

  it("extracts from youtu.be short URL", () => {
    expect(extractVideoId(new URL("https://youtu.be/dQw4w9WgXcQ"))).toBe("dQw4w9WgXcQ");
  });

  it("extracts from /shorts/", () => {
    expect(extractVideoId(new URL("https://youtube.com/shorts/abc123def"))).toBe("abc123def");
  });

  it("returns null for playlist URL with no v param", () => {
    expect(extractVideoId(new URL("https://www.youtube.com/playlist?list=PL123"))).toBeNull();
  });
});
