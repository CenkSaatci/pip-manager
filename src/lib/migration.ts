import { Character } from "../types/character";

type LegacyFields = {
  special?: Record<string, number>;
  currentHp?: number;
  currentApr?: number;
  karma?: number;
  caps?: number;
  tagSkillIds?: string[];
  backgroundAllocations?: Record<string, Record<string, number>>;
  hunger?: number;
  thirst?: number;
  injuredLimbs?: string[];
  crippledLimbs?: string[];
};

/**
 * Erkennt, ob ein Character-Objekt das alte Format (mit `special`,
 * `currentHp`, `tagSkillIds`, …) oder bereits das neue Format
 * (mit `stats`, `resources`, `tags`) hat.
 */
function isLegacyCharacter(c: Record<string, unknown>): boolean {
  return "special" in c && !("stats" in c);
}

/**
 * Migriert einen Character vom alten Format (Fallout-spezifische Felder)
 * ins neue generische Format (stats, resources, tags).
 *
 * Alte Felder werden entfernt. Die Migration ist idempotent – ein bereits
 * migrierter Character wird unverändert zurückgegeben.
 */
export function migrateCharacter(raw: Character): Character {
  const obj = raw as unknown as Record<string, unknown>;
  if (!isLegacyCharacter(obj)) {
    return raw;
  }

  const legacy = obj as unknown as LegacyFields;

  const migrated: Record<string, unknown> = {
    ...obj,
    stats: { ...(legacy.special ?? {}) },
    resources: {
      hp: legacy.currentHp ?? 0,
      apr: legacy.currentApr ?? 0,
      karma: legacy.karma ?? 0,
    },
    tags: [...(legacy.tagSkillIds ?? [])],
    caps: legacy.caps ?? 0,
  };

  delete migrated.special;
  delete migrated.currentHp;
  delete migrated.currentApr;
  delete migrated.karma;
  delete migrated.tagSkillIds;
  delete migrated.hunger;
  delete migrated.thirst;
  delete migrated.injuredLimbs;
  delete migrated.crippledLimbs;

  return migrated as unknown as Character;
}

/** Export für Tests – prüft, ob ein Objekt das alte Format hat. */
export function _isLegacyCharacter(c: Record<string, unknown>): boolean {
  return isLegacyCharacter(c);
}
