# Tasks — Multi-System-Abstraktion

**Branch:** `feature/multi-system-abstraction`  
**Detailanalyse:** `docs/phase1-analysis.md`

---

## Phase 1a: Typen & Migration

Ziel: Character-Modell generisch machen + Migration alter Charaktere.

| # | Task | Datei | Aufwand |
|---|---|---|---|
| 1.1 | `UiTemplate`, `UiResourceDef`, `UiPanelDef` Interfaces definieren | `src/types/rules.ts` | ~30min |
| 1.2 | `RuleSet.ui?: UiTemplate` + `CharacterCreationConfig.statConfig` hinzufügen | `src/types/rules.ts` | ~15min |
| 1.3 | `stats`, `resources`, `tags` zu Character; alte Felder optional/deprecated | `src/types/character.ts` | ~30min |
| 1.4 | `migrateCharacter()` – erkennt Legacy-Format, konvertiert `special→stats`, `currentHp→resources.hp` etc. | `src/lib/migration.ts` (NEU) | ~30min |
| 1.5 | `loadAll()` ruft `migrateCharacter()` für jeden geladenen Charakter | `src/store/useAppStore.ts` | ~10min |
| 1.6 | `blankCharacter()` auf neues Format umstellen | `src/types/character.ts` | ~10min |
| 1.7 | `getStats()`, `getResources()` Helper in derived.ts | `src/lib/derived.ts` | ~15min |
| 1.8 | Tests für migrateCharacter, getStats, getResources | `src/lib/derived.test.ts` | ~30min |

**Checkpoint:** TypeScript kompiliert, Tests grün. Alte Charaktere werden automatisch migriert.

---

## Phase 1b: derived.ts & Berechnungen

Ziel: Alle derived-Funktionen nutzen `char.stats`/`char.resources` statt `char.special`/`char.currentHp`.

| # | Task | Datei | Aufwand |
|---|---|---|---|
| 2.1 | `getEffectiveSpecial()` → `getEffectiveStats(char, rules)` – nutzt `char.stats` + `rules.ui.statKeys` | `src/lib/derived.ts` | ~20min |
| 2.2 | `getMaxHp()` → `getResourceMax(char, rules, key)` – liest aus `rules.formulas.resourceMax[key]` oder Alt-Feld | `src/lib/derived.ts` | ~20min |
| 2.3 | `baseScope()` liefert alle statKeys aus Ruleset statt festem SPECIAL | `src/lib/derived.ts` | ~15min |
| 2.4 | Alle derived-Funktionen aktualisieren (getCarryWeight, getHealingRate, getSkillEffectiveValue, getDicePoolSize) | `src/lib/derived.ts` | ~30min |
| 2.5 | `checkPerkRequirements()` stat-Prüfung auf generische stats umstellen | `src/lib/derived.ts` | ~15min |
| 2.6 | Tests für neue generische Funktionen aktualisieren/ergänzen | `src/lib/derived.test.ts` | ~30min |

**Checkpoint:** `npm test` grün, alle Berechnungen funktionieren mit neuem und altem Charakter-Format.

---

## Phase 1c: seed_ruleset & Example-Rulesets

| # | Task | Datei | Aufwand |
|---|---|---|---|
| 3.1 | Fallout-seed: `ui`-Template mit 7 SPECIALs, 4 Resources, allen Panels | `src-tauri/src/seed_ruleset.json` | ~20min |
| 3.2 | `characterCreation.statConfig` für Fallout (Start 5, +5 frei, Min 1, Max 10) | `src-tauri/src/seed_ruleset.json` | ~10min |
| 3.3 | D&D 5e Example-Ruleset (6 Stats, ~18 Skills, Races, Classes als Backgrounds) | `data/examples/dnd5e.json` (NEU) | ~60min |
| 3.4 | DSA Example-Ruleset (8 Stats, Talente, Vor-/Nachteile) | `data/examples/dsa.json` (NEU) | ~60min |
| 3.5 | Build verifizieren: TypeScript + Tests + Vite-Build | – | ~15min |

---

## Offene Punkte für Phase 2 (UI)

Hier nur auflisten, nicht umsetzen:

- Wizard-Schritte aus `rules.ui.wizardSteps` generieren
- StatsPanel aus `ruleSet.ui.stats` rendern
- Resource-Bars aus `ruleSet.ui.resources` generieren
- Optionale Panels (HitLocation, Needs, Spells) über `ruleSet.ui.panels` steuern
- MetaTab: Stats-Konfiguration editierbar machen
- Neue RulesManager-Tabs: `ui`-Template-Editor
