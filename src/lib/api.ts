import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile, writeFile } from "@tauri-apps/plugin-fs";
import { Character } from "../types/character";
import { RuleSet } from "../types/rules";

// --- RuleSets ---------------------------------------------------------

export async function listRuleSets(): Promise<RuleSet[]> {
  return invoke("list_rulesets");
}

export async function getActiveRuleSet(): Promise<RuleSet | null> {
  return invoke("get_active_ruleset");
}

export async function saveRuleSet(ruleSet: RuleSet): Promise<void> {
  return invoke("save_ruleset", { ruleset: ruleSet });
}

export async function setActiveRuleSet(id: string): Promise<void> {
  return invoke("set_active_ruleset", { id });
}

export async function deleteRuleSet(id: string): Promise<void> {
  return invoke("delete_ruleset", { id });
}

// --- Characters ---------------------------------------------------------

export async function listCharacters(): Promise<Character[]> {
  return invoke("list_characters");
}

export async function saveCharacter(character: Character): Promise<void> {
  return invoke("save_character", { character });
}

export async function deleteCharacter(id: string): Promise<void> {
  return invoke("delete_character", { id });
}

// --- Datei-Import/Export (JSON) -----------------------------------------

export async function importJsonFile<T>(): Promise<T | null> {
  const path = await open({
    multiple: false,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!path || Array.isArray(path)) return null;
  const content = await readTextFile(path);
  return JSON.parse(content) as T;
}

export async function exportJsonFile(data: unknown, suggestedName: string): Promise<boolean> {
  const path = await save({
    defaultPath: suggestedName,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!path) return false;
  await writeTextFile(path, JSON.stringify(data, null, 2));
  return true;
}

export async function exportBinaryFile(
  data: Uint8Array,
  suggestedName: string,
  extension: string,
  filterName: string
): Promise<boolean> {
  const path = await save({
    defaultPath: suggestedName,
    filters: [{ name: filterName, extensions: [extension] }],
  });
  if (!path) return false;
  await writeFile(path, data);
  return true;
}
