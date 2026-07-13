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
  specialAllocations: Record<string, number>;
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
  caps?: number;

  /** Generische Stats (Attribut-Key → Wert). Für Fallout: STR/PER/END/CHA/INT/AGI/LUK */
  stats: Record<string, number>;
  /** Generische Ressourcen (Resource-Key → Wert), z.B. "hp", "mana", "karma" */
  resources: Record<string, number>;
  /** Generische Tags/Markierungen (Fallback für tagSkillIds, proficiencies, …) */
  tags: string[];

  /** frei investierte Skillpunkte (Erstellung + Levelaufstiege), on top von Basis/Hintergrund/Tag-Skill */
  skills: Record<string, number>;
  /** Punkte-Kauf-Zuteilungen je Hintergrund-Pool: poolName -> skillId -> investierte Punkte */
  backgroundAllocations?: Record<string, Record<string, number>>;
  traitIds: string[];
  perks: CharacterPerk[];
  levelHistory: LevelUpRecord[];
  sessionLog: SessionLogEntry[];
  inventory: InventoryEntry[];
  appearance?: string;
  backstory?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // ── Alte Felder (deprecated, für Migration) ──────────────────────
  /** @deprecated use stats */
  special?: Record<SpecialKey, number>;
  /** @deprecated use resources.hp */
  currentHp?: number;
  /** @deprecated use resources.apr */
  currentApr?: number;
  /** @deprecated use resources.karma */
  karma?: number;
  /** @deprecated use tags */
  tagSkillIds?: string[];
  /** @deprecated */
  hunger?: number;
  /** @deprecated */
  thirst?: number;
  /** @deprecated */
  injuredLimbs?: string[];
  /** @deprecated */
  crippledLimbs?: string[];
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
    caps: 0,
    stats: { STR: 5, PER: 5, END: 5, CHA: 5, INT: 5, AGI: 5, LUK: 5 },
    resources: { hp: 0, apr: 0, karma: 0, hunger: 0, thirst: 0 },
    tags: [],
    skills: {},
    backgroundAllocations: {},
    traitIds: [],
    perks: [],
    levelHistory: [],
    sessionLog: [],
    inventory: [],
    appearance: "",
    backstory: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}
