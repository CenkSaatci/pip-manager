/**
 * Kompatibilitäts-Helfer für den Übergang vom alten Character-Format
 * (special, currentHp, tagSkillIds, …) zum neuen Format
 * (stats, resources, tags, …).
 *
 * Alle Funktionen lesen zuerst das neue Feld, fallen bei Abwesenheit
 * auf das alte zurück. So funktionieren alte Charaktere aus der DB
 * und neue (von blankCharacter) nahtlos nebeneinander.
 */
import { Character, InventoryEntry } from "../types/character";

/** Gibt die Stats eines Charakters zurück – egal ob altes oder neues Format. */
export function getStats(char: Character): Record<string, number> {
  return char.stats ?? (char.special as Record<string, number> | undefined) ?? {};
}

/** Gibt eine bestimmte Resource zurück (mit Fallback auf alte Einzelfelder). */
export function getResource(char: Character, key: string): number {
  if (char.resources && key in char.resources) return char.resources[key];
  const legacyMap: Record<string, string> = {
    hp: "currentHp",
    apr: "currentApr",
    karma: "karma",
  };
  const legacyKey = legacyMap[key];
  if (legacyKey) return (char as any)[legacyKey] ?? 0;
  return 0;
}

/** Setzt eine Resource und gibt ein neues Character-Objekt zurück. */
export function setResource(char: Character, key: string, value: number): Character {
  if (char.resources) {
    return { ...char, resources: { ...char.resources, [key]: value } };
  }
  const legacySet: Record<string, string> = {
    hp: "currentHp",
    apr: "currentApr",
    karma: "karma",
  };
  if (legacySet[key]) {
    return { ...char, [legacySet[key]]: value } as Character;
  }
  return char;
}

/** Gibt die Tags zurück (neues Feld tags, Fallback tagSkillIds). */
export function getTags(char: Character): string[] {
  if (char.tags !== undefined) return char.tags;
  if (char.tagSkillIds !== undefined) return char.tagSkillIds;
  return [];
}

/** Gibt ein Set-Tags-Objekt zurück (schreibt in neues oder altes Feld). */
export function setTags(char: Character, tags: string[]): Character {
  if (char.tags !== undefined || !char.tagSkillIds) {
    return { ...char, tags };
  }
  return { ...char, tagSkillIds: tags };
}

export function getCaps(char: Character): number {
  return char.caps ?? 0;
}
