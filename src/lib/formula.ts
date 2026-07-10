// Die App wertet vom GM in JSON hinterlegte Formeln aus (z.B. maxHp,
// Skill-Basiswerte). Da PIP-MANAGER eine lokale Single-User-Desktop-App
// ist (kein Netzwerk, keine fremden Eingaben), reicht ein simpler,
// auf einen festen Variablen-Scope beschränkter Function()-Aufruf.
// Nur die übergebenen Variablennamen sind im Scope sichtbar.

export type FormulaScope = Record<string, number>;

/** SPECIAL-Bonus-Tabelle laut Regelwerk: 1-4 -> 0, 5-7 -> 1, 8-9 -> 2, 10 -> 3 */
export function specialBonus(value: number): number {
  if (value >= 10) return 3;
  if (value >= 8) return 2;
  if (value >= 5) return 1;
  return 0;
}

export function evalFormula(formula: string, scope: FormulaScope): number {
  if (!formula || !formula.trim()) return 0;
  const keys = [...Object.keys(scope), "specialBonus"];
  const values: unknown[] = [...Object.values(scope), specialBonus];
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `"use strict"; return (${formula});`);
    const result = fn(...values);
    if (typeof result !== "number" || Number.isNaN(result)) return 0;
    return Math.round(result * 100) / 100;
  } catch (err) {
    console.error("Formel-Fehler:", formula, err);
    return 0;
  }
}
