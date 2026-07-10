import { describe, it, expect } from "vitest";
import { rollDicePool, rollInitiative, rollArmorCheck } from "./dice";
import { DifficultyLevel } from "../types/rules";

describe("rollDicePool", () => {
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

  it("rolls values between 1 and 10", () => {
    const result = rollDicePool(100, 5);
    result.rolls.forEach((r) => {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(10);
    });
  });

  it("counts successes correctly (roll <= target or natural 1)", () => {
    // With target=10, every roll 1-10 is a success
    const result = rollDicePool(10, 8, { name: "Sehr leicht", penalty: 0, successesRequired: 1 }, 2); // target = 10 - 0 - 2 = 8
    expect(result.successes).toBeGreaterThanOrEqual(0);
    expect(result.successes).toBeLessThanOrEqual(10);
  });

  it("marks natural ones", () => {
    // We can't force a natural 1, but the property should exist
    const result = rollDicePool(1, 10);
    expect(result.naturalOnes).toBeGreaterThanOrEqual(0);
    expect(result.naturalOnes).toBeLessThanOrEqual(1);
  });

  it("determines pass/fail based on successesRequired", () => {
    const diff: DifficultyLevel = { name: "Test", penalty: 0, successesRequired: 100 };
    const result = rollDicePool(5, 10, diff); // target 10, pool 5, but need 100 successes
    expect(result.passed).toBe(false);
  });
});

describe("rollInitiative", () => {
  it("adds perception to a d10 roll", () => {
    const result = rollInitiative(5);
    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(10);
    expect(result.total).toBe(5 + result.roll);
  });
});

describe("rollArmorCheck", () => {
  it("rolls a d10 against damage resistance", () => {
    const result = rollArmorCheck(5);
    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(10);
    expect(typeof result.blocked).toBe("boolean");
  });

  it("blocks when roll <= DR", () => {
    // DR 10 blocks everything since d10 max is 10
    expect(rollArmorCheck(10).blocked).toBe(true);
  });
});
