import { Character } from "../types/character";
import { RuleSet } from "../types/rules";
import { seedRuleSet } from "./seed";

/** Prüft, ob die App innerhalb von Tauri läuft (vs. Browser dev mode). */
function isTauri(): boolean {
  return typeof window !== "undefined" && "ipc" in (window as any).__TAURI_INTERNALS__;
}

// ─── Tauri-Imports (nur wenn verfügbar) ────────────────────────────────

let tauriInvoke: typeof import("@tauri-apps/api/core").invoke | null = null;
let tauriOpen: typeof import("@tauri-apps/plugin-dialog").open | null = null;
let tauriSave: typeof import("@tauri-apps/plugin-dialog").save | null = null;
let tauriReadTextFile: typeof import("@tauri-apps/plugin-fs").readTextFile | null = null;
let tauriWriteTextFile: typeof import("@tauri-apps/plugin-fs").writeTextFile | null = null;
let tauriWriteFile: typeof import("@tauri-apps/plugin-fs").writeFile | null = null;

if (isTauri()) {
  import("@tauri-apps/api/core").then((m) => { tauriInvoke = m.invoke; });
  import("@tauri-apps/plugin-dialog").then((m) => { tauriOpen = m.open; tauriSave = m.save; });
  import("@tauri-apps/plugin-fs").then((m) => { tauriReadTextFile = m.readTextFile; tauriWriteTextFile = m.writeTextFile; tauriWriteFile = m.writeFile; });
}

// ─── localStorage-Helper (Browser-Fallback) ────────────────────────────

const LS_RULESETS = "pm_rulesets";
const LS_CHARACTERS = "pm_characters";
const LS_ACTIVE = "pm_active_ruleset";

function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)); }
  catch { return fallback; }
}
function lsSet(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }

// ─── Helpers ───────────────────────────────────────────────────────────

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (tauriInvoke) return tauriInvoke(cmd, args) as Promise<T>;
  throw new Error("Tauri nicht verfügbar (Browser-Mode)");
}

function browserOpenFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      resolve(await file.text());
    };
    input.click();
  });
}

function browserSaveFile(content: string, suggestedName: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── RuleSets ──────────────────────────────────────────────────────────

export async function listRuleSets(): Promise<RuleSet[]> {
  if (isTauri()) {
    try { return await invoke("list_rulesets"); } catch { /* fallback */ }
  }
  return lsGet<RuleSet[]>(LS_RULESETS, []);
}

export async function getActiveRuleSet(): Promise<RuleSet | null> {
  if (isTauri()) {
    try { return await invoke("get_active_ruleset"); } catch { /* fallback */ }
  }
  const id = localStorage.getItem(LS_ACTIVE);
  if (!id) return null;
  const all = lsGet<RuleSet[]>(LS_RULESETS, []);
  return all.find((r) => r.id === id) ?? null;
}

export async function saveRuleSet(ruleSet: RuleSet): Promise<void> {
  if (isTauri()) {
    try { await invoke("save_ruleset", { ruleset: ruleSet }); return; } catch { /* fallback */ }
  }
  const all = lsGet<RuleSet[]>(LS_RULESETS, []).filter((r) => r.id !== ruleSet.id);
  lsSet(LS_RULESETS, [...all, ruleSet]);
}

export async function setActiveRuleSet(id: string): Promise<void> {
  if (isTauri()) {
    try { await invoke("set_active_ruleset", { id }); return; } catch { /* fallback */ }
  }
  localStorage.setItem(LS_ACTIVE, id);
}

export async function deleteRuleSet(id: string): Promise<void> {
  if (isTauri()) {
    try { await invoke("delete_ruleset", { id }); return; } catch { /* fallback */ }
  }
  const all = lsGet<RuleSet[]>(LS_RULESETS, []).filter((r) => r.id !== id);
  lsSet(LS_RULESETS, all);
  if (localStorage.getItem(LS_ACTIVE) === id) localStorage.removeItem(LS_ACTIVE);
}

// ─── Characters ────────────────────────────────────────────────────────

export async function listCharacters(): Promise<Character[]> {
  if (isTauri()) {
    try { return await invoke("list_characters"); } catch { /* fallback */ }
  }
  return lsGet<Character[]>(LS_CHARACTERS, []);
}

export async function saveCharacter(character: Character): Promise<void> {
  if (isTauri()) {
    try { await invoke("save_character", { character }); return; } catch { /* fallback */ }
  }
  const all = lsGet<Character[]>(LS_CHARACTERS, []).filter((c) => c.id !== character.id);
  lsSet(LS_CHARACTERS, [...all, character]);
}

export async function deleteCharacter(id: string): Promise<void> {
  if (isTauri()) {
    try { await invoke("delete_character", { id }); return; } catch { /* fallback */ }
  }
  const all = lsGet<Character[]>(LS_CHARACTERS, []).filter((c) => c.id !== id);
  lsSet(LS_CHARACTERS, all);
}

// ─── Datei-Import/Export (JSON) ─────────────────────────────────────────

export async function importJsonFile<T>(): Promise<T | null> {
  if (isTauri() && tauriOpen && tauriReadTextFile) {
    try {
      const path = await tauriOpen({ multiple: false, filters: [{ name: "JSON", extensions: ["json"] }] });
      if (!path || Array.isArray(path)) return null;
      const content = await tauriReadTextFile(path);
      return JSON.parse(content) as T;
    } catch { /* fallback */ }
  }
  const text = await browserOpenFile();
  if (!text) return null;
  return JSON.parse(text) as T;
}

export async function exportJsonFile(data: unknown, suggestedName: string): Promise<boolean> {
  const json = JSON.stringify(data, null, 2);
  if (isTauri() && tauriSave && tauriWriteTextFile) {
    try {
      const path = await tauriSave({ defaultPath: suggestedName, filters: [{ name: "JSON", extensions: ["json"] }] });
      if (!path) return false;
      await tauriWriteTextFile(path, json);
      return true;
    } catch { /* fallback */ }
  }
  browserSaveFile(json, suggestedName);
  return true;
}

export async function exportBinaryFile(
  data: Uint8Array, suggestedName: string, _extension: string, _filterName: string
): Promise<boolean> {
  if (isTauri() && tauriSave && tauriWriteFile) {
    try {
      const path = await tauriSave({ defaultPath: suggestedName, filters: [{ name: _filterName, extensions: [_extension] }] });
      if (!path) return false;
      await tauriWriteFile(path, data);
      return true;
    } catch { /* fallback */ }
  }
  const blob = new Blob([data as unknown as ArrayBuffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

// ─── Seed (Browser-Mode) ───────────────────────────────────────────────

/** Initialisiert Standard-Daten für den Browser-Mode (ohne Tauri-Rust-Backend). */
export async function ensureSeedData(): Promise<void> {
  if (isTauri()) return;
  const existing = lsGet<RuleSet[]>(LS_RULESETS, []);
  if (existing.length > 0) return;
  const ruleset = seedRuleSet();
  lsSet(LS_RULESETS, [ruleset]);
  localStorage.setItem(LS_ACTIVE, ruleset.id);
}
