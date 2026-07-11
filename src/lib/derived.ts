import { Character } from "../types/character";
import { RuleSet, Skill, SPECIAL_KEYS } from "../types/rules";
import { evalFormula } from "./formula";
import { getStats, getResource, getTags, setResource, getCaps } from "./compat";

function baseScope(char: Character, rules: RuleSet) {
  const stats = getStats(char);
  return {
    ...stats,
    level: char.level,
    karma: getResource(char, "karma"),
  };
}

export function getTraitEffectSum(target: string, char: Character, rules: RuleSet): number {
  let sum = 0;
  for (const traitId of char.traitIds) {
    const trait = rules.traits.find((t) => t.id === traitId);
    if (!trait) continue;
    for (const effect of [...trait.benefits, ...trait.drawbacks]) {
      if (effect.target === target) sum += effect.amount;
    }
  }
  return sum;
}

export function getPerkEffectSum(target: string, char: Character, rules: RuleSet): number {
  let sum = 0;
  for (const entry of char.perks) {
    const perk = rules.perks.find((p) => p.id === entry.perkId);
    if (!perk?.effects) continue;
    for (const effect of perk.effects) {
      if (effect.target === target) sum += effect.amount * entry.rank;
    }
  }
  return sum;
}

export function getEffectiveSpecial(char: Character, rules: RuleSet): Record<string, number> {
  const stats = getStats(char);
  const race = rules.races.find((r) => r.id === char.raceId);
  const result = { ...stats } as Record<string, number>;
  for (const key of SPECIAL_KEYS) {
    const raceMod = race?.statModifiers[key] ?? 0;
    const traitMod = getTraitEffectSum(key, char, rules);
    const perkMod = getPerkEffectSum(key, char, rules);
    result[key] = (result[key] ?? 0) + raceMod + traitMod + perkMod;
  }
  return result;
}

/** @deprecated Alias für getEffectiveSpecial */
export const applyRaceModifiers = getEffectiveSpecial;

export function getMaxHp(char: Character, rules: RuleSet): number {
  return evalFormula(rules.formulas.maxHp, baseScope(char, rules)) + getTraitEffectSum("maxHp", char, rules) + getPerkEffectSum("maxHp", char, rules);
}

export function getMaxApr(char: Character, rules: RuleSet): number {
  return evalFormula(rules.formulas.maxApr, baseScope(char, rules)) + getTraitEffectSum("maxApr", char, rules) + getPerkEffectSum("maxApr", char, rules);
}

export function getCarryWeight(char: Character, rules: RuleSet): number {
  const race = rules.races.find((r) => r.id === char.raceId);
  const base = evalFormula(rules.formulas.carryWeight, baseScope(char, rules));
  return base + (race?.carryWeightModifier ?? 0) + getTraitEffectSum("carryWeight", char, rules) + getPerkEffectSum("carryWeight", char, rules);
}

export function getHealingRate(char: Character, rules: RuleSet): number {
  return evalFormula(rules.formulas.healingRate, baseScope(char, rules)) + getTraitEffectSum("healingRate", char, rules) + getPerkEffectSum("healingRate", char, rules);
}

export function getLuckBonusDice(char: Character, rules: RuleSet): number {
  return evalFormula(rules.formulas.luckBonusDice, baseScope(char, rules));
}

export function getSkillPointsPerLevel(char: Character, rules: RuleSet): number {
  if (!rules.formulas.skillPointsPerLevel) return 0;
  return evalFormula(rules.formulas.skillPointsPerLevel, baseScope(char, rules));
}

export function getSkillBaseValue(skill: Skill, char: Character, rules: RuleSet): number {
  return evalFormula(skill.baseFormula, baseScope(char, rules));
}

export function getBackgroundBonus(skillId: string, char: Character): number {
  let sum = 0;
  for (const pool of Object.values(char.backgroundAllocations)) {
    sum += pool[skillId] ?? 0;
  }
  return sum;
}

export function getFixedBackgroundBonus(skillId: string, char: Character, rules: RuleSet): number {
  const bg = rules.backgrounds.find((b) => b.id === char.backgroundId);
  return bg?.fixedSkillBonuses?.[skillId] ?? 0;
}

export function isTagSkill(skillId: string, char: Character): boolean {
  return getTags(char).includes(skillId);
}

export function getSkillEffectiveValue(skill: Skill, char: Character, rules: RuleSet): number {
  const base = getSkillBaseValue(skill, char, rules);
  const fixedBg = getFixedBackgroundBonus(skill.id, char, rules);
  const pointBuyBg = getBackgroundBonus(skill.id, char);
  const tagBonus = isTagSkill(skill.id, char) ? rules.characterCreation.tagSkillBonus : 0;
  const invested = char.skills[skill.id] ?? 0;
  const traitMod = getTraitEffectSum(skill.id, char, rules);
  const perkMod = getPerkEffectSum(skill.id, char, rules);
  const [min, max] = rules.skillRange;
  return Math.min(max, Math.max(min, base + fixedBg + pointBuyBg + tagBonus + invested + traitMod + perkMod));
}

export function getDicePoolSize(skill: Skill, char: Character, rules: RuleSet): number {
  return Math.max(1, getSkillEffectiveValue(skill, char, rules) + getLuckBonusDice(char, rules));
}

export function getCurrentCarriedWeight(char: Character, rules: RuleSet): number {
  return char.inventory.reduce((sum, entry) => {
    const item = rules.items.find((i) => i.id === entry.itemId);
    if (!item) return sum;
    return sum + item.weight * entry.quantity;
  }, 0);
}

export function checkPerkRequirements(
  perk: RuleSet["perks"][number],
  char: Character
): { met: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const req = perk.requirements;
  const stats = getStats(char);
  if (req.level && char.level < req.level) reasons.push(`Level ${req.level} benötigt`);
  if (req.requiresGmApproval) reasons.push("Meistergenehmigung nötig");
  if (req.stats) {
    for (const [stat, min] of Object.entries(req.stats)) {
      if ((stats[stat] ?? 0) < (min ?? 0)) reasons.push(`${stat} ≥ ${min} benötigt`);
    }
  }
  if (req.skills) {
    for (const [skillId, min] of Object.entries(req.skills)) {
      if ((char.skills[skillId] ?? 0) < min) reasons.push(`Skill ${skillId} ≥ ${min} benötigt`);
    }
  }
  if (req.perkIds) {
    for (const pid of req.perkIds) {
      if (!char.perks.some((p) => p.perkId === pid)) reasons.push(`Perk ${pid} benötigt`);
    }
  }
  return { met: reasons.length === 0, reasons };
}

export function applyConsumable(char: Character, rules: RuleSet, item: RuleSet["items"][number]): Character {
  if (item.type !== "consumable" || !item.effects) return char;
  let result = { ...char };
  const maxHp = getMaxHp(char, rules);
  for (const effect of item.effects) {
    switch (effect.target) {
      case "hp":
        const current = getResource(result, "hp");
        result = setResource(result, "hp", Math.min(maxHp, Math.max(0, current + effect.amount)));
        break;
      case "hunger":
        result = { ...result, hunger: Math.max(0, (result.hunger ?? 0) - effect.amount) };
        break;
      case "thirst":
        result = { ...result, thirst: Math.max(0, (result.thirst ?? 0) - effect.amount) };
        break;
    }
  }
  return result;
}

export function isExtremeSpecialValue(value: number, rules: RuleSet): boolean {
  return value <= rules.characterCreation.extremeValueThreshold;
}

export function getLevelReward(level: number, rules: RuleSet) {
  const explicit = rules.levelProgression.find((r) => r.level === level);
  const fallbackSkillPoints = rules.formulas.skillPointsPerLevel
    ? evalFormula(rules.formulas.skillPointsPerLevel, { level })
    : 0;
  return {
    specialPoints: explicit?.specialPoints ?? 0,
    skillPoints: explicit?.skillPoints ?? fallbackSkillPoints,
    tagSkillSlots: explicit?.tagSkillSlots ?? 0,
    perkSlots: explicit?.perkSlots ?? 0,
    note: explicit?.note,
  };
}
