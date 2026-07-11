# Tasks — Multi-System-Abstraktion

**Branch:** `feature/multi-system-abstraction`  
**Basis:** `develop`  
**Ziel:** PIP-Manager von einem Fallout-only-Tool zu einem multi-system-fähigen Character-Manager abstrahieren.

---

## Phase 1: Datenmodell (2–3 Sessions)

### 1.1 RuleSet um `ui`-Template erweitern

**Datei:** `src/types/rules.ts`

- `UiTemplate`-Interface definieren:
  - `statsLabel: string` (z.B. "Attribute", "Eigenschaften")
  - `statKeys: string[]` (z.B. `["STR","PER","END","CHA","INT","AGI","LUK"]`)
  - `statLabels: Record<string, string>` (z.B. `{ "STR": "Stärke", … }`)
  - `resources: UiResource[]` mit `{ key, label, formula?, color }`
  - `panels: string[]` – aktivierte Standard-Panels
  - `optionalPanels: Record<string, { enabled: boolean, label: string }>`
- `ui`-Feld an `RuleSet` anhängen (optional, Fallback auf Fallout-Default)
- `emptyRuleSet()` mit Default-UI für Fallout aktualisieren

### 1.2 Character-Modell generisch machen

**Datei:** `src/types/character.ts`

- `special: Record<SpecialKey, number>` → `stats: Record<string, number>`
- `currentHp: number`, `currentApr: number`, `karma: number`, `hunger: number`, `thirst: number` → `resources: Record<string, number>`
- `tagSkillIds: string[]` → `tags: string[]`
- `backgroundAllocations: Record<string, Record<string, number>>` → `allocations: Record<string, Record<string, number>>`
- `CharacterCap`-Interface mit `statsCap: Record<string, number>` und `resourcesCap: Record<string, number>` (für Maximalwerte)
- `blankCharacter()` entsprechend aktualisieren

### 1.3 Migration bestehender Charaktere

**Datei:** `src/lib/migration.ts` (neu)

- Funktion `migrateCharacter(old: any): Character`
- Erkennt Alt-Format (`character.special` existiert)
- Mappt `special` → `stats`, `currentHp` → `resources.hp`, etc.
- Wird beim Laden aus der DB aufgerufen

### 1.4 derived.ts anpassen

- `getEffectiveSpecial()` → `getEffectiveStats(char, rules)` (liest statKeys aus RuleSet)
- `getPerkEffectSum()`, `getTraitEffectSum()` → unverändert (arbeiten auf generischen Targets)
- `getMaxHp()`, `getMaxApr()` → `getResourceMax(char, rules, resourceKey)`

### 1.5 seed_ruleset.json & Beispiel-Rulesets

- Fallout-seed auf neues Format migrieren (stats, resources, ui-template)
- `data/examples/dnd5e_ruleset.json` anlegen
- `data/examples/dsa_ruleset.json` anlegen

---

## Phase 2: UI (2–3 Sessions)

### 2.1 StatsPanel generisch

**Datei:** `src/components/CharacterSheet/SpecialPanel.tsx` → `StatsPanel.tsx`

- Liest `ruleSet.ui.statKeys` und `ruleSet.ui.statLabels`
- Rendert generische Attribut-Anzeige mit +/- Buttons
- Name, Label, Spaltenanzahl aus RuleSet

### 2.2 Resource-Bars generisch

**Datei:** `src/components/CharacterSheet/index.tsx` (ResourceBar-Bereich)

- Iteriert über `ruleSet.ui.resources`
- Rendert für jeden Eintrag einen ResourceBar mit passender Farbe/formula
- Fallback für nicht-definierte Formeln

### 2.3 Optionale Panels steuern

**Datei:** `src/components/CharacterSheet/index.tsx`

- `HitLocationPanel` nur rendern, wenn `ruleSet.ui.optionalPanels.hitLocations.enabled`
- `NeedsPanel` nur rendern, wenn `ruleSet.ui.optionalPanels.needs.enabled`
- `SessionLogPanel` immer (systemunabhängig)
- Neues `SpellPanel` (z.B. für D&D), wenn `ruleSet.ui.optionalPanels.spells.enabled`

### 2.4 CharacterWizard anpassen

**Datei:** `src/components/CharacterWizard/index.tsx`

- SPECIAL-Schritt → generischer Stats-Schritt (liest statKeys/labels aus RuleSet)
- Hintergrund-Schritt → generischer Allocation-Schritt
- Skills-Schritt bleibt (bereits generisch)
- Traits-Schritt bleibt (bereits generisch)

### 2.5 RulesManager erweitern

**Datei:** `src/components/RulesManager/index.tsx`

- Neuer Tab für UI-Template
- Editor für statKeys, statLabels, resources, panels
- Validierung des ui-Templates

---

## Phase 3: Beispiel-Systeme (1 Session)

### 3.1 D&D 5e Example-Ruleset

- 6 Stats (STR/DEX/CON/INT/WIS/CHA)
- ~18 Skills (Acrobatics, Arcana, Athletics, …)
- 12+ Classes als Hintergründe/Perks
- Races (Human, Elf, Dwarf, …)
- HP, HD, Proficiency-Bonus als Resources
- Spells als optionales Panel

### 3.2 DSA Example-Ruleset

- 8 Stats (MU/KL/IN/CH/FF/GE/KO/KK)
- Talente als Skills
- Vor-/Nachteile als Traits
- Profan/Spontan/Verbreitung als Zauber-Kategorien

### 3.3 Test-Charaktere

- Je einen Beispiel-Charakter pro System anlegen
- CharacterSheet-Rendering validieren
- Würfelterminal-Test (W20 für D&D, W20 für DSA)

---

## Offene Fragen / Design-Entscheidungen

- [ ] **Versionierung:** Wie umgehen mit alten Charakteren, wenn sich das Regelwerk ändert?
- [ ] **Stats-Budget:** Aktuell Fallout-spezifisch (Start 5, +5 frei). Für D&D wäre Point-Buy oder Standard-Array nötig – in `characterCreation` abbildbar?
- [ ] **Resources-Cap:** `currentHp` wird via `getMaxHp` gecappt. Für generische Resources bräuchte es `getResourceMax(key)` – aus Formula oder fixem Wert im RuleSet?
- [ ] **Würfelmechanik:** Fallout nutzt W10-Pool, D&D W20+Modifier, DSA W20+W20+W6. Wie stark muss `dice.ts` abstrahiert werden?
