import { SpecialKey } from "./rules";

export interface InventoryEntry {
  itemId: string;
  quantity: number;
  equipped: boolean;
  currentAmmo?: number;
}

export interface CharacterPerk {
  perkId: string;
  rank: number;
}

/** Protokoll eines abgeschlossenen Levelaufstiegs, damit Zuteilungen nicht doppelt vergeben werden */
export interface LevelUpRecord {
  level: number;
  specialAllocations: Partial<Record<SpecialKey, number>>;
  skillAllocations: Record<string, number>;
  tagSkillsAdded: string[];
  perksChosen: string[];
  hpGained: number;
  timestamp: string;
}

export interface SessionLogEntry {
  id: string;
  timestamp: string;
  text: string;
}

export interface Character {
  id: string;
  ruleSetId: string;
  name: string;
  playerName?: string;
  raceId: string;
  backgroundId: string;
  level: number;
  xp: number;
  karma: number;
  caps: number;
  special: Record<SpecialKey, number>;
  /** frei investierte Skillpunkte (Erstellung + Levelaufstiege), on top von SPECIAL-Basis/Hintergrund/Tag-Skill */
  skills: Record<string, number>;
  /** gewählte Tag-Skills (laut Regelwerk max. characterCreation.tagSkillCount) */
  tagSkillIds: string[];
  /** Punkte-Kauf-Zuteilungen je Hintergrund-Pool: poolName -> skillId -> investierte Punkte */
  backgroundAllocations: Record<string, Record<string, number>>;
  traitIds: string[];
  perks: CharacterPerk[];
  levelHistory: LevelUpRecord[];
  sessionLog: SessionLogEntry[];
  inventory: InventoryEntry[];
  currentHp: number;
  currentApr: number;
  hunger: number;
  thirst: number;
  injuredLimbs: string[];
  crippledLimbs: string[];
  appearance?: string;
  backstory?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function blankCharacter(ruleSetId: string): Character {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ruleSetId,
    name: "Neuer Wanderer",
    playerName: "",
    raceId: "",
    backgroundId: "",
    level: 1,
    xp: 0,
    karma: 0,
    caps: 0,
    special: { STR: 5, PER: 5, END: 5, CHA: 5, INT: 5, AGI: 5, LUK: 5 },
    skills: {},
    tagSkillIds: [],
    backgroundAllocations: {},
    traitIds: [],
    perks: [],
    levelHistory: [],
    sessionLog: [],
    inventory: [],
    currentHp: 0,
    currentApr: 0,
    hunger: 0,
    thirst: 0,
    injuredLimbs: [],
    crippledLimbs: [],
    appearance: "",
    backstory: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}
