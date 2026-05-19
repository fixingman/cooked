export function scaleQuantity(quantity: number, scale: number): string {
  const scaled = quantity * scale;
  if (scaled === 0) return "";
  if (scaled === Math.floor(scaled)) return String(scaled);

  const fractions: [number, string][] = [
    [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"],
    [3 / 8, "⅜"], [1 / 2, "½"], [5 / 8, "⅝"],
    [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"],
  ];

  const whole = Math.floor(scaled);
  const decimal = scaled - whole;
  let bestFraction = "";
  let bestDiff = Infinity;

  for (const [val, sym] of fractions) {
    const diff = Math.abs(decimal - val);
    if (diff < bestDiff) { bestDiff = diff; bestFraction = sym; }
  }

  if (bestDiff > 0.06) return scaled.toFixed(1);
  return whole > 0 ? `${whole}${bestFraction}` : bestFraction;
}
