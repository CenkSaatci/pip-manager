import { describe, it, expect } from "vitest";
import { Character } from "../types/character";
import { RuleSet, SPECIAL_KEYS } from "../types/rules";
import {
  getEffectiveSpecial,
  getTraitEffectSum,
  getPerkEffectSum,
  getMaxHp,
  getMaxApr,
  getSkillEffectiveValue,
  getDicePoolSize,
  checkPerkRequirements,
  getLevelReward,
  isExtremeSpecialValue,
  applyConsumable,
} from "./derived";

function makeRules(overrides?: Partial<RuleSet>): RuleSet {
  return {
    id: "test-rules",
    name: "Test-Regelwerk",
    version: "0.1",
    diceSystem: "W10",
    specialRange: [1, 10],
    skillRange: [0, 10],
    karmaRange: [-10, 10],
    disabledMechanics: [],
    characterCreation: {
      specialStart: 5,
      freeSpecialPoints: 5,
      specialMin: 1,
      specialMax: 10,
      extremeValueThreshold: 2,
      freeSkillPoints: 8,
      tagSkillCount: 3,
      tagSkillBonus: 1,
      skillCapAtCreation: 6,
    },
    levelProgression: [
      { level: 2, skillPoints: 5 },
      { level: 3, skillPoints: 5, perkSlots: 1 },
      { level: 4, skillPoints: 5, specialPoints: 1 },
    ],
    hitLocations: [
      { id: "torso", name: "Torso", penalty: 0 },
      { id: "kopf", name: "Kopf", penalty: -4 },
    ],
    formulas: {
      maxHp: "(STR+END)*5",
      maxApr: "1 + specialBonus(AGI)",
      carryWeight: "150 + (STR*10)",
      healingRate: "1 + specialBonus(END)",
      luckBonusDice: "specialBonus(LUK)",
      skillPointsPerLevel: "5",
    },
    difficultyLevels: [
      { name: "Normal", penalty: -2, successesRequired: 3 },
    ],
    skills: [
      { id: "handfeuerwaffen", name: "Handfeuerwaffen", governingStat: "AGI", baseFormula: "specialBonus(AGI)" },
      { id: "medizin", name: "Medizin", governingStat: "INT", baseFormula: "specialBonus(INT)" },
    ],
    races: [
      { id: "human", name: "Mensch", statModifiers: {} },
    ],
    traits: [],
    perks: [
      {
        id: "feldsanitaeter",
        name: "Feldsanitäter",
        description: "Schnellere Heilung.",
        maxRanks: 1,
        requirements: { level: 3, stats: { INT: 6 } },
        effects: [
          { target: "medizin", amount: 1, note: "Erweiterte Erste Hilfe" },
          { target: "healingRate", amount: 1, note: "Schnellere Wundheilung" },
        ],
      },
    ],
    backgrounds: [],
    items: [],
    enemies: [],
    ...overrides,
  };
}

function makeChar(overrides?: Partial<Character>): Character {
  return {
    id: "test-char",
    ruleSetId: "test-rules",
    name: "Test-Wanderer",
    playerName: "",
    raceId: "human",
    backgroundId: "",
    level: 1,
    xp: 0,
    caps: 0,
    stats: { STR: 5, PER: 5, END: 5, CHA: 5, INT: 5, AGI: 5, LUK: 5 },
    resources: { hp: 30, apr: 2, karma: 0 },
    tags: [],
    skills: {},
    backgroundAllocations: {},
    traitIds: [],
    perks: [],
    inventory: [],
    sessionLog: [],
    levelHistory: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getTraitEffectSum", () => {
  it("returns 0 when no traits are active", () => {
    const char = makeChar();
    const rules = makeRules();
    expect(getTraitEffectSum("STR", char, rules)).toBe(0);
  });

  it("sums trait effects for a target SPECIAL key", () => {
    const rules = makeRules({
      traits: [
        {
          id: "test_trait",
          name: "Test",
          description: "",
          benefits: [{ target: "STR", amount: 2 }],
          drawbacks: [{ target: "INT", amount: -1 }],
        },
      ],
    });
    const char = makeChar({ traitIds: ["test_trait"] });
    expect(getTraitEffectSum("STR", char, rules)).toBe(2);
    expect(getTraitEffectSum("INT", char, rules)).toBe(-1);
  });
});

describe("getPerkEffectSum", () => {
  it("returns 0 when no perks are owned", () => {
    const char = makeChar();
    const rules = makeRules();
    expect(getPerkEffectSum("medizin", char, rules)).toBe(0);
  });

  it("sums perk effects weighted by rank", () => {
    const rules = makeRules();
    const char = makeChar({ perks: [{ perkId: "feldsanitaeter", rank: 1 }] });
    expect(getPerkEffectSum("medizin", char, rules)).toBe(1);
    expect(getPerkEffectSum("healingRate", char, rules)).toBe(1);
  });

  it("multiplies effects by rank", () => {
    const rules = makeRules({
      perks: [
        {
          id: "multi_rank",
          name: "Multi-Rank",
          maxRanks: 3,
          requirements: {},
          effects: [{ target: "STR", amount: 1 }],
        },
      ],
    });
    const char = makeChar({ perks: [{ perkId: "multi_rank", rank: 3 }] });
    expect(getPerkEffectSum("STR", char, rules)).toBe(3);
  });
});

describe("getEffectiveSpecial", () => {
  it("returns base SPECIAL when no mods apply", () => {
    const char = makeChar();
    const rules = makeRules();
    const result = getEffectiveSpecial(char, rules);
    SPECIAL_KEYS.forEach((k) => expect(result[k]).toBe(5));
  });

  it("includes race modifiers", () => {
    const rules = makeRules({
      races: [{ id: "strong", name: "Stark", statModifiers: { STR: 2, INT: -1 } }],
    });
    const char = makeChar({ raceId: "strong" });
    const result = getEffectiveSpecial(char, rules);
    expect(result.STR).toBe(7);
    expect(result.INT).toBe(4);
  });

  it("includes trait and perk effects", () => {
    const rules = makeRules({
      traits: [
        { id: "bonus_str", name: "+STR", description: "", benefits: [{ target: "STR", amount: 1 }], drawbacks: [] },
      ],
    });
    const char = makeChar({ traitIds: ["bonus_str"], perks: [{ perkId: "feldsanitaeter", rank: 1 }] });
    const result = getEffectiveSpecial(char, rules);
    expect(result.STR).toBe(6);
  });
});

describe("getMaxHp", () => {
  it("calculates (STR+END)*5", () => {
    const char = makeChar();
    const rules = makeRules();
    expect(getMaxHp(char, rules)).toBe(50);
  });

  it("includes trait and perk bonuses", () => {
    const rules = makeRules({
      traits: [
        { id: "zaeh", name: "Zäh", description: "", benefits: [{ target: "maxHp", amount: 10 }], drawbacks: [] },
      ],
    });
    const char = makeChar({ traitIds: ["zaeh"] });
    expect(getMaxHp(char, rules)).toBe(60);
  });
});

describe("getSkillEffectiveValue", () => {
  it("returns base value when no points invested", () => {
    const char = makeChar();
    const rules = makeRules();
    const skill = rules.skills[0];
    expect(getSkillEffectiveValue(skill, char, rules)).toBe(skill.baseFormula === "specialBonus(AGI)" ? 1 : 0);
  });

  it("includes invested skill points", () => {
    const char = makeChar({ skills: { handfeuerwaffen: 3 } });
    const rules = makeRules();
    const skill = rules.skills.find((s) => s.id === "handfeuerwaffen")!;
    expect(getSkillEffectiveValue(skill, char, rules)).toBe(4); // base 1 + invested 3
  });

  it("includes tag skill bonus", () => {
    const char = makeChar({ skills: { handfeuerwaffen: 3 }, tags: ["handfeuerwaffen"] });
    const rules = makeRules();
    const skill = rules.skills.find((s) => s.id === "handfeuerwaffen")!;
    expect(getSkillEffectiveValue(skill, char, rules)).toBe(5); // base 1 + tag 1 + invested 3
  });

  it("includes perk effects", () => {
    const rules = makeRules();
    const char = makeChar({ perks: [{ perkId: "feldsanitaeter", rank: 1 }] });
    const skill = rules.skills.find((s) => s.id === "medizin")!;
    expect(getSkillEffectiveValue(skill, char, rules)).toBe(2); // base 1 + perk 1
  });
});

describe("getDicePoolSize", () => {
  it("is at least 1", () => {
    const rules = makeRules();
    const char = makeChar({ stats: { ...makeChar().stats, LUK: 1 } });
    const skill = rules.skills[0];
    expect(getDicePoolSize(skill, char, rules)).toBeGreaterThanOrEqual(1);
  });
});

describe("checkPerkRequirements", () => {
  it("is met when character meets all requirements", () => {
    const rules = makeRules();
    const perk = rules.perks[0]; // feldsanitaeter: level 3, INT 6
    const char = makeChar({ level: 3, stats: { STR: 5, PER: 5, END: 5, CHA: 5, INT: 6, AGI: 5, LUK: 5 } });
    const result = checkPerkRequirements(perk, char);
    expect(result.met).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("fails when level is too low", () => {
    const rules = makeRules();
    const perk = rules.perks[0];
    const char = makeChar({ stats: { STR: 5, PER: 5, END: 5, CHA: 5, INT: 6, AGI: 5, LUK: 5 } });
    const result = checkPerkRequirements(perk, char);
    expect(result.met).toBe(false);
    expect(result.reasons.some((r) => r.includes("Level"))).toBe(true);
  });
});

describe("getLevelReward", () => {
  it("returns explicit rewards when defined", () => {
    const rules = makeRules();
    const reward = getLevelReward(2, rules);
    expect(reward.skillPoints).toBe(5);
    expect(reward.specialPoints).toBe(0);
    expect(reward.perkSlots).toBe(0);
  });

  it("falls back to formula when level has no explicit entry", () => {
    const rules = makeRules();
    const reward = getLevelReward(1, rules);
    expect(reward.skillPoints).toBe(5); // fallback from formulas.skillPointsPerLevel
  });

  it("returns perk slots for level 3", () => {
    const rules = makeRules();
    const reward = getLevelReward(3, rules);
    expect(reward.perkSlots).toBe(1);
  });

  it("returns special points for level 4", () => {
    const rules = makeRules();
    const reward = getLevelReward(4, rules);
    expect(reward.specialPoints).toBe(1);
  });
});

describe("applyConsumable", () => {
  it("returns the same char if the item is not a consumable", () => {
    const rules = makeRules({
      items: [{ id: "pistol", name: "Pistole", type: "weapon", weight: 1, value: 50, damage: 3, skillId: "handfeuerwaffen" }],
    });
    const char = makeChar({ currentHp: 20 });
    const result = applyConsumable(char, rules, rules.items[0]);
    expect(result.currentHp).toBe(20);
  });

  it("returns the same char if the item has no effects", () => {
    const rules = makeRules({
      items: [{ id: "useless", name: "Nutzlos", type: "consumable", weight: 0, value: 0 }],
    });
    const char = makeChar({ currentHp: 20 });
    const result = applyConsumable(char, rules, rules.items[0]);
    expect(result.currentHp).toBe(20);
  });

  it("heals HP from a Stimpak", () => {
    const rules = makeRules({
      items: [{ id: "stimpak", name: "Stimpak", type: "consumable", weight: 0.1, value: 50, effects: [{ target: "hp", amount: 20 }] }],
    });
    const char = makeChar({ resources: { hp: 30, apr: 2, karma: 0 } });
    const result = applyConsumable(char, rules, rules.items[0]);
    expect(result.resources?.hp ?? result.currentHp).toBe(50); // 30 + 20
  });

  it("caps HP at maxHp", () => {
    const rules = makeRules({
      items: [{ id: "super_stimpak", name: "Super Stimpak", type: "consumable", weight: 0.1, value: 100, effects: [{ target: "hp", amount: 100 }] }],
    });
    const char = makeChar({ resources: { hp: 45, apr: 2, karma: 0 } });
    const result = applyConsumable(char, rules, rules.items[0]);
    expect(result.resources?.hp ?? result.currentHp).toBe(50); // maxHp = (5+5)*5 = 50
  });

  it("does not reduce HP below 0", () => {
    const rules = makeRules({
      items: [{ id: "poison", name: "Gift", type: "consumable", weight: 0.1, value: 0, effects: [{ target: "hp", amount: -100 }] }],
    });
    const char = makeChar({ resources: { hp: 10, apr: 2, karma: 0 } });
    const result = applyConsumable(char, rules, rules.items[0]);
    expect(result.resources?.hp ?? result.currentHp).toBe(0);
  });

  it("reduces hunger and thirst (positive amount = nourishment)", () => {
    const rules = makeRules({
      items: [{ id: "food", name: "Essen", type: "consumable", weight: 0.5, value: 10, effects: [{ target: "hunger", amount: 20 }, { target: "thirst", amount: 10 }] }],
    });
    const char = makeChar({ resources: { hp: 0, apr: 0, karma: 0, hunger: 30, thirst: 40 } });
    const result = applyConsumable(char, rules, rules.items[0]);
    expect(result.resources?.hunger).toBe(10); // 30 - 20
    expect(result.resources?.thirst).toBe(30); // 40 - 10
  });
});

describe("isExtremeSpecialValue", () => {
  it("returns true for values at or below threshold", () => {
    const rules = makeRules();
    expect(isExtremeSpecialValue(2, rules)).toBe(true);
    expect(isExtremeSpecialValue(1, rules)).toBe(true);
  });

  it("returns false for values above threshold", () => {
    const rules = makeRules();
    expect(isExtremeSpecialValue(3, rules)).toBe(false);
    expect(isExtremeSpecialValue(5, rules)).toBe(false);
  });
});
