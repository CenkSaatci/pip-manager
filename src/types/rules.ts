// Alle Typen, die das Regelwerk beschreiben. Ein RuleSet ist vollstaendig
// als JSON import-/exportierbar -- das ist die zentrale Erweiterungsstelle
// der App. Ein GM kann ein neues Regelwerk (oder eine Erweiterung) bauen,
// ohne eine Zeile Code anzufassen.

export type SpecialKey = "STR" | "PER" | "END" | "CHA" | "INT" | "AGI" | "LUK";

export const SPECIAL_KEYS: SpecialKey[] = ["STR", "PER", "END", "CHA", "INT", "AGI", "LUK"];

export const SPECIAL_LABELS: Record<SpecialKey, string> = {
  STR: "Stärke",
  PER: "Wahrnehmung",
  END: "Ausdauer",
  CHA: "Charisma",
  INT: "Intelligenz",
  AGI: "Geschicklichkeit",
  LUK: "Glück",
};

export interface Skill {
  id: string;
  name: string;
  governingStat: SpecialKey;
  /**
   * Formel für den Startwert des Skills vor Verteilung von Punkten.
   * Die Funktion specialBonus(x) steht im Scope zur Verfügung
   * (1-4 -> 0, 5-7 -> 1, 8-9 -> 2, 10 -> 3), z.B. "specialBonus(AGI)".
   */
  baseFormula: string;
  description?: string;
  /** informativ, z.B. wenn laut Regelwerk mehrere Attribute passen können */
  alternateStats?: SpecialKey[];
}

export interface StatModifier {
  stat: SpecialKey;
  amount: number;
}

export interface Race {
  id: string;
  name: string;
  description?: string;
  statModifiers: Partial<Record<SpecialKey, number>>;
  /** frei formulierte Rassen-Fähigkeiten, rein informativ / für Notizen */
  specialAbilities?: string[];
  startingTraitIds?: string[];
  carryWeightModifier?: number;
}

export interface TraitEffect {
  target: string; // z.B. "STR", "hp", "apr" oder ein Skill-Key
  amount: number;
  note?: string;
}

export interface Trait {
  id: string;
  name: string;
  description?: string;
  benefits: TraitEffect[];
  drawbacks: TraitEffect[];
}

export interface PerkRequirement {
  level?: number;
  stats?: Partial<Record<SpecialKey, number>>;
  skills?: Record<string, number>;
  perkIds?: string[];
  requiresGmApproval?: boolean;
}

export interface Perk {
  id: string;
  name: string;
  description?: string;
  maxRanks: number;
  requirements: PerkRequirement;
  effects?: TraitEffect[];
}

export type ItemType = "weapon" | "armor" | "consumable" | "ammo" | "misc";

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  weight: number;
  value: number;
  description?: string;
  /** waffenspezifisch: fester Schadenswert, Erfolge aus dem Angriffswurf werden addiert */
  damage?: number;
  skillId?: string; // welcher Skill für Angriffe mit dieser Waffe genutzt wird
  isAutomatic?: boolean;
  burstAmmoCost?: number;
  burstDamageBonus?: number;
  /** rüstungsspezifisch: DR wird gegen einen 1W10-Rüstungswurf verglichen */
  damageResistance?: number;
  isHelmet?: boolean;
  requiresTraining?: boolean; // z.B. Power Armor
  /** konsumierbar-spezifisch */
  effects?: TraitEffect[];
  addictionChance?: number;
}

/** Punkte-Kauf-Pool innerhalb eines Hintergrunds, z.B. "6 Punkte, max +2 pro Skill" */
export interface SkillPointBuyPool {
  poolName: string;
  points: number;
  maxPerSkill: number;
  eligibleSkillIds: string[];
}

export interface BackgroundStartingItem {
  itemId: string;
  quantity: number;
}

export interface Background {
  id: string;
  name: string;
  description?: string;
  requiresGmApproval?: boolean;
  /** feste, garantierte Boni (z.B. Militär/NCR-Grundausbildung) */
  fixedSkillBonuses?: Record<string, number>;
  /** frei wählbare Punkte-Pools (z.B. "6 Punkte aus dieser Liste, max +2/Skill") */
  pointBuyPools?: SkillPointBuyPool[];
  startingItems?: BackgroundStartingItem[];
  startingCaps?: number;
}

export interface DifficultyLevel {
  name: string;
  penalty: number;
  successesRequired: number;
}

/** Statblock für Testgegner/NSCs, z.B. aus dem GM-Regelwerk Abschnitt 25 */
export interface Enemy {
  id: string;
  name: string;
  hp: number;
  damageResistance: number;
  skillValue: number;
  weaponId?: string;
  notes?: string;
}

export interface RuleFormulas {
  /** Variablen im Scope: STR,PER,END,CHA,INT,AGI,LUK,level,karma; Funktion specialBonus(x) verfügbar */
  maxHp: string;
  maxApr: string; // Aktionen pro Runde
  carryWeight: string;
  healingRate: string;
  luckBonusDice: string; // zusätzliche Würfel im Würfelpool durch Glück
  meleeDamageBonus?: string;
  skillPointsPerLevel?: string; // für Levelaufstiege nach der Erstellung
}

/** Parameter für die Charaktererstellung laut Regelwerk (Abschnitt 2, 6, 7) */
export interface CharacterCreationConfig {
  specialStart: number;
  freeSpecialPoints: number;
  specialMin: number;
  specialMax: number;
  extremeValueThreshold: number; // <= dieser Wert braucht Meistergenehmigung
  freeSkillPoints: number;
  tagSkillCount: number;
  tagSkillBonus: number;
  skillCapAtCreation: number;
}

/**
 * Was ein Charakter beim Erreichen eines bestimmten Levels zur Verfügung
 * hat, um selbst zu verteilen (Levelaufstiegs-Assistent im Charakterbogen).
 * Gibt es für ein Level keinen Eintrag, greift ein einfacher Fallback
 * (siehe getLevelReward in lib/derived.ts).
 */
export interface LevelReward {
  level: number;
  specialPoints?: number;
  skillPoints?: number;
  tagSkillSlots?: number;
  perkSlots?: number;
  note?: string;
}

/** Mechaniken, die laut Regelwerk (Abschnitt 24) für v0.1 bewusst gestrichen sind. */
export type OptionalMechanic =
  | "karma"
  | "equipmentCondition"
  | "vats"
  | "cyborg"
  | "synths"
  | "criticalMultipliers"
  | "sustainedFire";

/** Trefferzone für Called Shots und die Wundverfolgung im Charakterbogen */
export interface HitLocation {
  id: string;
  name: string;
  penalty: number; // Zusatzmalus auf den Zielwert bei einem gezielten Treffer
}

export interface RuleSet {
  id: string;
  name: string;
  version: string;
  diceSystem: string; // rein informativ, z.B. "W10-Würfelpool, roll-under"
  specialRange: [number, number];
  skillRange: [number, number];
  karmaRange: [number, number];
  disabledMechanics: OptionalMechanic[];
  characterCreation: CharacterCreationConfig;
  levelProgression: LevelReward[];
  hitLocations: HitLocation[];
  formulas: RuleFormulas;
  difficultyLevels: DifficultyLevel[];
  skills: Skill[];
  races: Race[];
  traits: Trait[];
  perks: Perk[];
  backgrounds: Background[];
  items: Item[];
  enemies: Enemy[];
}

export function emptyRuleSet(name = "Neues Regelwerk"): RuleSet {
  return {
    id: crypto.randomUUID(),
    name,
    version: "0.1",
    diceSystem: "W10-Würfelpool, roll-under",
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
      { level: 2, skillPoints: 5, perkSlots: 0, note: "Platzhalter — im Regelwerk nicht spezifiziert" },
      { level: 3, skillPoints: 5, perkSlots: 1 },
      { level: 4, skillPoints: 5, specialPoints: 1, perkSlots: 0, note: "SPECIAL-Erhöhung alle 4 Level (Platzhalter)" },
      { level: 5, skillPoints: 5, perkSlots: 1 },
      { level: 6, skillPoints: 5, perkSlots: 1 },
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
    skills: [],
    races: [],
    traits: [],
    perks: [],
    backgrounds: [],
    items: [],
    enemies: [],
  };
}
