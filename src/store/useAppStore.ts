import { create } from "zustand";
import { Character } from "../types/character";
import { RuleSet, emptyRuleSet } from "../types/rules";
import * as api from "../lib/api";
import { migrateCharacter } from "../lib/migration";

interface AppState {
  ruleSets: RuleSet[];
  activeRuleSet: RuleSet;
  characters: Character[];
  selectedCharacterId: string | null;
  view: "characters" | "sheet" | "rules";
  loading: boolean;

  loadAll: () => Promise<void>;
  selectCharacter: (id: string | null) => void;
  setView: (view: AppState["view"]) => void;

  upsertCharacter: (c: Character) => Promise<void>;
  removeCharacter: (id: string) => Promise<void>;

  upsertRuleSet: (r: RuleSet) => Promise<void>;
  activateRuleSet: (id: string) => Promise<void>;
  removeRuleSet: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  ruleSets: [],
  activeRuleSet: emptyRuleSet("Fallout: Big Apple Wasteland (Hausregeln)"),
  characters: [],
  selectedCharacterId: null,
  view: "characters",
  loading: true,

  loadAll: async () => {
    set({ loading: true });
    try {
      await api.ensureSeedData();
      const [ruleSets, active, characters] = await Promise.all([
        api.listRuleSets(),
        api.getActiveRuleSet(),
        api.listCharacters(),
      ]);
      set({
        ruleSets,
        activeRuleSet: active ?? get().activeRuleSet,
        characters: characters.map(migrateCharacter),
        loading: false,
      });
    } catch (err) {
      console.error("Laden fehlgeschlagen:", err);
      set({ loading: false });
    }
  },

  selectCharacter: (id) => set({ selectedCharacterId: id, view: id ? "sheet" : "characters" }),
  setView: (view) => set({ view }),

  upsertCharacter: async (c) => {
    await api.saveCharacter(c);
    const characters = get().characters.filter((x) => x.id !== c.id);
    set({ characters: [...characters, c] });
  },

  removeCharacter: async (id) => {
    await api.deleteCharacter(id);
    set({
      characters: get().characters.filter((c) => c.id !== id),
      selectedCharacterId: get().selectedCharacterId === id ? null : get().selectedCharacterId,
    });
  },

  upsertRuleSet: async (r) => {
    await api.saveRuleSet(r);
    const ruleSets = get().ruleSets.filter((x) => x.id !== r.id);
    const nextRuleSets = [...ruleSets, r];
    const isActive = get().activeRuleSet.id === r.id;
    set({ ruleSets: nextRuleSets, activeRuleSet: isActive ? r : get().activeRuleSet });
  },

  activateRuleSet: async (id) => {
    await api.setActiveRuleSet(id);
    const found = get().ruleSets.find((r) => r.id === id);
    if (found) set({ activeRuleSet: found });
  },

  removeRuleSet: async (id) => {
    await api.deleteRuleSet(id);
    set({ ruleSets: get().ruleSets.filter((r) => r.id !== id) });
  },
}));
