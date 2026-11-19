import { describe, expect, it } from "vitest";
import { getServingScale, scaleQuantity } from "@/lib/scaleIngredient";

describe("cooking serving overrides", () => {
  it.each([null, "", " ", "abc", "2people", "NaN", "Infinity", "-Infinity", "0", "-2", "1e309"])(
    "keeps original quantities for invalid or missing servings: %s", (query) => {
      const scale = getServingScale(4, Number(query));
      expect(scale).toBe(1);
      expect(scaleQuantity(100, scale)).toBe("100");
    },
  );

  it.each([0, -1, NaN, Infinity])("keeps quantities when the recipe yield is invalid: %s", (base) => {
    expect(getServingScale(base, 2)).toBe(1);
  });

  it("halves and doubles quantities without changing the original serving size", () => {
    expect(scaleQuantity(100, getServingScale(4, 2))).toBe("50");
    expect(scaleQuantity(100, getServingScale(4, 8))).toBe("200");
    expect(getServingScale(4, 4)).toBe(1);
  });

  it("scales a twenty-serving recipe down to one without clamping", () => {
    expect(scaleQuantity(100, getServingScale(20, 1))).toBe("5");
  });

  it("supports fractional serving counts and familiar ingredient fractions", () => {
    expect(scaleQuantity(1, getServingScale(4, Number("2.5")))).toBe("⅝");
    expect(scaleQuantity(1.5, getServingScale(4, 2))).toBe("¾");
    expect(scaleQuantity(0.5, getServingScale(4, 2))).toBe("¼");
    expect(scaleQuantity(3, getServingScale(4, 2))).toBe("1½");
    expect(scaleQuantity(0, getServingScale(4, 2))).toBe("");
  });

  it("rejects a ratio that overflows or underflows", () => {
    expect(getServingScale(Number.MIN_VALUE, Number.MAX_VALUE)).toBe(1);
    expect(getServingScale(Number.MAX_VALUE, Number.MIN_VALUE)).toBe(1);
  });
});
