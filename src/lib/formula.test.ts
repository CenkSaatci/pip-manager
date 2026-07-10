import { describe, it, expect } from "vitest";
import { specialBonus, evalFormula } from "./formula";

describe("specialBonus", () => {
  it("returns 0 for values 1-4", () => {
    expect(specialBonus(1)).toBe(0);
    expect(specialBonus(2)).toBe(0);
    expect(specialBonus(3)).toBe(0);
    expect(specialBonus(4)).toBe(0);
  });

  it("returns 1 for values 5-7", () => {
    expect(specialBonus(5)).toBe(1);
    expect(specialBonus(6)).toBe(1);
    expect(specialBonus(7)).toBe(1);
  });

  it("returns 2 for values 8-9", () => {
    expect(specialBonus(8)).toBe(2);
    expect(specialBonus(9)).toBe(2);
  });

  it("returns 3 for value 10", () => {
    expect(specialBonus(10)).toBe(3);
  });
});

describe("evalFormula", () => {
  it("evaluates a simple arithmetic expression", () => {
    expect(evalFormula("(STR+END)*5", { STR: 5, END: 5 })).toBe(50);
  });

  it("calls specialBonus within a formula", () => {
    const scope = { AGI: 7 };
    expect(evalFormula("1 + specialBonus(AGI)", scope)).toBe(2);
  });

  it("returns 0 for empty formula", () => {
    expect(evalFormula("", {})).toBe(0);
  });

  it("returns 0 for NaN results", () => {
    expect(evalFormula("undefinedVar", {})).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    expect(evalFormula("10/3", {})).toBe(3.33);
  });
});
