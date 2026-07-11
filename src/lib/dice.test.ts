import { describe, it, expect } from "vitest";
import { rollDicePool, rollInitiative, rollArmorCheck, rollD20, rollD20Initiative, roll3d20 } from "./dice";
import { DifficultyLevel } from "../types/rules";

describe("rollDicePool (d10-pool, Fallout)", () => {
  const normal: DifficultyLevel = { name: "Normal", penalty: -2, successesRequired: 3 };

  it("returns a result with the correct pool size", () => {
    const result = rollDicePool(5, 5);
    expect(result.poolSize).toBe(5);
    expect(result.rolls).toHaveLength(5);
  });

  it("applies difficulty penalty to target", () => {
    const result = rollDicePool(5, 5, normal);
    expect(result.target).toBe(3); // 5 - 2
  });

  it("applies extra penalty (added to difficulty penalty, net negative)", () => {
    const result = rollDicePool(5, 5, undefined, -3);
    expect(result.target).toBe(2); // 5 + 0 + (-3)
  });

  it("never goes below 0 for target", () => {
    const result = rollDicePool(5, 1, normal, -5); // 1 + (-2) + (-5) = -6 → 0
    expect(result.target).toBe(0);
  });

  it("has at least pool size 1", () => {
    const result = rollDicePool(-5, 5);
    expect(result.poolSize).toBe(1);
  });

  it("determines pass/fail based on successesRequired", () => {
    const diff: DifficultyLevel = { name: "Test", penalty: 0, successesRequired: 100 };
    const result = rollDicePool(5, 10, diff);
    expect(result.passed).toBe(false);
  });
});

describe("rollD20 (d20-plus, D&D)", () => {
  it("rolls a d20 and adds modifier", () => {
    const result = rollD20(5, 15);
    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(20);
    expect(result.total).toBe(result.roll + 5);
    expect(result.dc).toBe(15);
  });

  it("passes when total >= DC", () => {
    // With modifier 100, even a natural 1 passes
    const result = rollD20(100, 15);
    expect(result.passed).toBe(true);
  });

  it("fails when total < DC", () => {
    // With modifier 0 and DC 25, impossible on d20
    const result = rollD20(0, 25);
    expect(result.passed).toBe(false);
  });

  it("rolls twice with advantage", () => {
    const result = rollD20(0, 10, true);
    expect(result.rolls).toHaveLength(2);
    expect(result.advantage).toBe(true);
  });

  it("natural 20 (Nat20) always passes at DC 30 with +0 mod", () => {
    // We can't force a natural 20, but the function should handle it
    const result = rollD20(0, 30);
    // With mod 0 and DC 30, passing requires a 20
    expect(result.passed).toBe(result.roll === 20);
  });
});

describe("rollD20Initiative", () => {
  it("adds modifier to a d20 roll", () => {
    const result = rollD20Initiative(3);
    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(20);
    expect(result.total).toBe(result.roll + 3);
  });
});

describe("roll3d20 (DSA)", () => {
  it("rolls three d20s", () => {
    const result = roll3d20(12);
    expect(result.rolls).toHaveLength(3);
    result.rolls.forEach((r) => {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(20);
    });
  });

  it("counts successes (rolls <= target)", () => {
    // With target 20, all three rolls should be successes
    const result = roll3d20(20);
    expect(result.successes).toBe(3);
    expect(result.passed).toBe(true);
  });

  it("fails when not all three rolls succeed", () => {
    // With target 0, impossible to succeed
    const result = roll3d20(0);
    expect(result.successes).toBe(0);
    expect(result.passed).toBe(false);
  });
});
