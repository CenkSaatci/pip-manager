import { describe, it, expect } from "vitest";
import { migrateCharacter, _isLegacyCharacter as isLegacyCharacter } from "./migration";

describe("isLegacyCharacter", () => {
  it("returns true for objects with special but no stats", () => {
    expect(isLegacyCharacter({ special: { STR: 5 } })).toBe(true);
  });

  it("returns false for objects with stats", () => {
    expect(isLegacyCharacter({ stats: { STR: 5 } })).toBe(false);
  });

  it("returns false for empty objects", () => {
    expect(isLegacyCharacter({})).toBe(false);
  });
});

describe("migrateCharacter", () => {
  it("converts special → stats", () => {
    const result = migrateCharacter({ special: { STR: 5, PER: 6 } } as any);
    expect(result.stats).toEqual({ STR: 5, PER: 6 });
  });

  it("converts currentHp/karma → resources", () => {
    const result = migrateCharacter({ special: {}, currentHp: 30, currentApr: 2, karma: 5 } as any);
    expect(result.resources).toEqual({ hp: 30, apr: 2, karma: 5 });
  });

  it("converts tagSkillIds → tags", () => {
    const result = migrateCharacter({ special: {}, tagSkillIds: ["a", "b"] } as any);
    expect(result.tags).toEqual(["a", "b"]);
  });

  it("preserves generic fields unchanged", () => {
    const result = migrateCharacter({ special: {}, name: "Test", level: 3, skills: { handfeuerwaffen: 4 } } as any);
    expect(result.name).toBe("Test");
    expect(result.level).toBe(3);
    expect(result.skills).toEqual({ handfeuerwaffen: 4 });
  });

  it("removes legacy fields from the result", () => {
    const result = migrateCharacter({ special: {}, currentHp: 30, karma: 5, tagSkillIds: [] } as any);
    expect((result as any).special).toBeUndefined();
    expect((result as any).currentHp).toBeUndefined();
    expect((result as any).karma).toBeUndefined();
    expect((result as any).tagSkillIds).toBeUndefined();
  });

  it("is idempotent — already migrated objects pass through unchanged", () => {
    const input = { stats: { STR: 5 }, resources: { hp: 30 }, tags: [] };
    const result = migrateCharacter(input as any);
    expect(result.stats).toEqual({ STR: 5 });
    expect(result.resources).toEqual({ hp: 30 });
    expect(result.tags).toEqual([]);
  });
});
