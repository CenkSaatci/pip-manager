import { RuleSet, fallbackUiTemplate } from "../types/rules";
import dndExample from "../../data/examples/dnd5e_ruleset.json";
import dsaExample from "../../data/examples/dsa_ruleset.json";

/** Erzeugt das Standard-Fallout-Regelwerk für den Browser-Mode (ohne Rust-Backend). */
export function seedRuleSet(): RuleSet {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Wasteland-Testregelwerk v0.1 (Big-Apple-Kampfmotor, Hausregeln)",
    version: "0.1",
    diceSystem: "W10-Würfelpool: Pool = Skillwert + Luck-Bonus, jeder Wurf <= Zielwert ist ein Erfolg, natürliche 1 zählt immer",
    specialRange: [1, 10],
    skillRange: [0, 10],
    karmaRange: [-10, 10],
    disabledMechanics: ["karma", "equipmentCondition", "vats", "cyborg", "synths", "criticalMultipliers", "sustainedFire"],
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
      { level: 5, skillPoints: 5, perkSlots: 1 },
      { level: 6, skillPoints: 5 },
      { level: 7, skillPoints: 5, perkSlots: 1 },
      { level: 8, skillPoints: 5, specialPoints: 1 },
      { level: 9, skillPoints: 5, perkSlots: 1 },
      { level: 10, skillPoints: 5, tagSkillSlots: 1 },
      { level: 11, skillPoints: 5, perkSlots: 1 },
      { level: 12, skillPoints: 5, specialPoints: 1 },
      { level: 13, skillPoints: 5, perkSlots: 1 },
      { level: 14, skillPoints: 5 },
      { level: 15, skillPoints: 5, perkSlots: 1, tagSkillSlots: 1 },
      { level: 16, skillPoints: 5, specialPoints: 1 },
      { level: 17, skillPoints: 5, perkSlots: 1 },
      { level: 18, skillPoints: 5 },
      { level: 19, skillPoints: 5, perkSlots: 1 },
      { level: 20, skillPoints: 5, specialPoints: 1 },
    ],
    hitLocations: [
      { id: "torso", name: "Torso", penalty: 0 },
      { id: "kopf", name: "Kopf", penalty: -4 },
      { id: "arm_links", name: "Linker Arm", penalty: -2 },
      { id: "arm_rechts", name: "Rechter Arm", penalty: -2 },
      { id: "bein_links", name: "Linkes Bein", penalty: -2 },
      { id: "bein_rechts", name: "Rechtes Bein", penalty: -2 },
    ],
    formulas: {
      maxHp: "(STR+END)*5",
      maxApr: "1 + specialBonus(AGI)",
      carryWeight: "150 + (STR*10)",
      healingRate: "1 + specialBonus(END)",
      luckBonusDice: "specialBonus(LUK)",
      meleeDamageBonus: "Math.max(0, STR-5)",
      skillPointsPerLevel: "5",
    },
    difficultyLevels: [
      { name: "Sehr leicht", penalty: 0, successesRequired: 1 },
      { name: "Leicht", penalty: -1, successesRequired: 2 },
      { name: "Normal", penalty: -2, successesRequired: 3 },
      { name: "Schwer", penalty: -3, successesRequired: 4 },
      { name: "Sehr schwer", penalty: -4, successesRequired: 5 },
    ],
    skills: [
      { id: "handfeuerwaffen", name: "Handfeuerwaffen", governingStat: "AGI", baseFormula: "specialBonus(AGI)", description: "Pistolen, Revolver, Maschinenpistolen" },
      { id: "langwaffen", name: "Langwaffen", governingStat: "PER", baseFormula: "specialBonus(PER)", description: "Gewehre, Karabiner, Schrotflinten" },
      { id: "schwere_waffen", name: "Schwere Waffen", governingStat: "END", baseFormula: "specialBonus(END)", description: "MGs, Miniguns, Raketenwerfer" },
      { id: "nahkampf", name: "Nahkampf", governingStat: "STR", baseFormula: "specialBonus(STR)" },
      { id: "schleichen", name: "Schleichen", governingStat: "AGI", baseFormula: "specialBonus(AGI)" },
      { id: "wahrnehmung", name: "Wahrnehmung", governingStat: "PER", baseFormula: "specialBonus(PER)" },
      { id: "reparieren", name: "Reparieren", governingStat: "INT", baseFormula: "specialBonus(INT)" },
      { id: "medizin", name: "Medizin", governingStat: "INT", baseFormula: "specialBonus(INT)" },
      { id: "ueberleben", name: "Überleben", governingStat: "END", baseFormula: "specialBonus(END)" },
      { id: "einfluss", name: "Einfluss", governingStat: "CHA", baseFormula: "specialBonus(CHA)", alternateStats: ["STR", "INT", "PER"] },
      { id: "handel", name: "Handel", governingStat: "CHA", baseFormula: "specialBonus(CHA)" },
    ],
    races: [
      { id: "human", name: "Mensch", description: "Vielseitig und anpassungsfähig.", statModifiers: {} },
    ],
    traits: [],
    perks: [],
    backgrounds: [],
    items: [
      { id: "pistole_9mm", name: "9mm Pistole", type: "weapon", weight: 1.2, value: 80, damage: 4, skillId: "handfeuerwaffen" },
      { id: "hunting_rifle", name: "Hunting Rifle", type: "weapon", weight: 4, value: 400, damage: 13, skillId: "langwaffen" },
      { id: "stimpak", name: "Stimpak", type: "consumable", weight: 0.1, value: 50, effects: [{ target: "hp", amount: 20 }] },
    ],
    enemies: [],
    ui: fallbackUiTemplate(),
  };
}

/** Gibt alle Standard-Regelwerke zurück (Fallout + D&D + DSA). */
export function seedRuleSets(): RuleSet[] {
  const fallout = seedRuleSet();
  const dnd = dndExample as unknown as RuleSet;
  const dsa = dsaExample as unknown as RuleSet;
  return [fallout, dnd, dsa];
}
