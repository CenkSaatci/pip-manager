# Phase 1 – Detailanalyse Datenmodell-Abstraktion

Branch: `feature/multi-system-abstraction`
Stand: `6e44a88` (develop)

---

## 1. IST-Analyse: Alle Touchpoints

### 1.1 Character-Felder (17 Fallout-spezifisch)

```
Feld                    Typ                              System
──────────────────────────────────────────────────────────────────
special                 Record<SpecialKey, number>       Fallout (7 SPECIALs)
currentHp               number                           generisch, aber HP-spezifisch
currentApr              number                           Fallout (APR = Aktionen pro Runde)
karma                   number                           Fallout
caps                    number                           Fallout (Währung)
hunger                  number                           Fallout-Survival
thirst                  number                           Fallout-Survival
injuredLimbs            string[]                         Fallout (Trefferzonen)
crippledLimbs           string[]                         Fallout (Trefferzonen)
tagSkillIds             string[]                         Fallout-Konzept
backgroundAllocations   Record<string, Record<…>>        Fallout (Punkte-Kauf)

── generische Felder ───────────────────────────────────
id, ruleSetId, name, playerName            generisch
raceId, backgroundId                       generisch (leere IDs = ignoriert)
level, xp                                  generisch
skills: Record<string, number>             generisch (Skill-ID → Punkte)
traitIds: string[]                         generisch
perks: CharacterPerk[]                     generisch
inventory: InventoryEntry[]                generisch
appearance, backstory, notes               generisch
sessionLog, levelHistory                   generisch
createdAt, updatedAt                       generisch
```

### 1.2 Dateien, die `char.special` lesen/schreiben

| Datei | Nutzung |
|---|---|
| `src/components/CharacterSheet/SpecialPanel.tsx` | Liest `char.special[key]`, `SPECIAL_KEYS`, `SPECIAL_LABELS`, `rules.specialRange` |
| `src/components/CharacterSheet/LevelUpModal.tsx` | Liest `char.special`, `SPECIAL_KEYS`, `SPECIAL_LABELS`, schreibt `char.special` |
| `src/components/CharacterSheet/PrintSheet.tsx` | Liest `Object.keys(effective)` von `getEffectiveSpecial` |
| `src/components/CharacterSheet/DiceRollerPanel.tsx` | Liest `getEffectiveSpecial(char, rules).PER` |
| `src/components/CharacterWizard/index.tsx` | Liest `char.special[key]`, `SPECIAL_KEYS`, `SPECIAL_LABELS`, `cc.specialStart/Min/Max` |
| `src/lib/derived.ts` | `getEffectiveSpecial()` liest `char.special`, alle Formeln nutzen `baseScope` |
| `src/lib/pdf.ts` | Liest `Object.keys(effective)` |

### 1.3 Dateien, die `char.currentHp`/`currentApr`/`karma`/`caps` lesen

| Datei | Nutzung |
|---|---|
| `src/components/CharacterSheet/index.tsx` | ResourceBar: `char.currentHp`, `char.currentApr`, zeigt `karma`, `caps`, `xp` |
| `src/components/CharacterSheet/PrintSheet.tsx` | `char.currentHp`, `char.caps` |
| `src/components/CharacterSheet/LevelUpModal.tsx` | `char.currentHp`, `char.currentApr` |
| `src/lib/pdf.ts` | `char.currentHp`, `char.caps` |
| `src/lib/derived.ts` | `getMaxHp()`, `getMaxApr()` (Formeln, indirekt) |

### 1.4 Dateien, die `char.hunger`/`thirst`/`injuredLimbs`/`crippledLimbs` lesen

| Datei | Nutzung |
|---|---|
| `src/components/CharacterSheet/NeedsPanel.tsx` | `char.hunger`, `char.thirst` |
| `src/components/CharacterSheet/HitLocationPanel.tsx` | `char.injuredLimbs`, `char.crippledLimbs` |

### 1.5 RuleSet `characterCreation` (Fallout-spezifisch)

```typescript
characterCreation: {
  specialStart: number;          // Fallout
  freeSpecialPoints: number;     // Fallout
  specialMin: number;            // Fallout
  specialMax: number;            // Fallout
  extremeValueThreshold: number; // Fallout
  freeSkillPoints: number;       // generisch
  tagSkillCount: number;         // Fallout-Konzept
  tagSkillBonus: number;         // Fallout-Konzept
  skillCapAtCreation: number;    // generisch
}
```

### 1.6 RulesManager MetaTab (Fallout-spezifisch)

- Zeigt Felder wie `specialStart`, `freeSpecialPoints`, `specialMin`, `specialMax`, `extremeValueThreshold`
- Zeigt Mechaniken wie `karma`, `equipmentCondition`, `vats`, `cyborg`, `synths`, `criticalMultipliers`, `sustainedFire`
- Formeln zeigen Variablen-Hinweis: `STR, PER, END, CHA, INT, AGI, LUK`

---

## 2. SOLL: Ziel-Architektur

### 2.1 Character generisch

```typescript
export interface Character {
  id: string;
  ruleSetId: string;
  name: string;
  playerName?: string;
  raceId: string;
  backgroundId: string;
  level: number;
  xp: number;
  
  // NEU: generische Stats/Resources/Tags
  stats: Record<string, number>;        // "STR"=5, "INT"=15, "WIS"=14, "MU"=12 …
  resources: Record<string, number>;    // "hp"=30, "mana"=10, "karma"=0 …
  tags: string[];                       // "tagSkills", "proficiencies", …
  caps: number;                         // bleibt als Währung (systemunabhängig)
  
  // ALT: deprecated, für Migration
  /** @deprecated use stats */
  special?: Record<SpecialKey, number>;
  
  // Generische Felder (unverändert)
  skills: Record<string, number>;
  traitIds: string[];
  perks: CharacterPerk[];
  inventory: InventoryEntry[];
  levelHistory: LevelUpRecord[];
  sessionLog: SessionLogEntry[];
  appearance?: string;
  backstory?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 UiTemplate im RuleSet

```typescript
export interface UiResourceDef {
  key: string;        // z.B. "hp"
  label: string;      // z.B. "Trefferpunkte"
  formula?: string;   // z.B. "maxHp" → aus rules.formulas
  color: string;      // CSS-Farbe: "red" | "amber" | "blue" | "green"
  icon?: string;      // optional
}

export interface UiPanelDef {
  enabled: boolean;
  label: string;
}

export interface UiTemplate {
  statsLabel: string;                                     // "Attribute", "Eigenschaften", …
  stats: {
    key: string;                                           // "STR"
    label: string;                                         // "Stärke"
    shortLabel?: string;                                   // "ST" für enge Layouts
  }[];
  resources: UiResourceDef[];
  panels: {
    skills: UiPanelDef;
    perks: UiPanelDef;
    traits: UiPanelDef;
    inventory: UiPanelDef;
    dice: UiPanelDef;
    hitLocations: UiPanelDef;
    needs: UiPanelDef;
    spells: UiPanelDef;
    [key: string]: UiPanelDef;
  };
  /** Welche Erstellungs-Schritte aktiv sind */
  wizardSteps?: {
    race?: UiPanelDef;
    background?: UiPanelDef;
    traits?: UiPanelDef;
    [key: string]: UiPanelDef | undefined;
  };
}

export interface RuleSet {
  // … bestehende Felder …
  ui?: UiTemplate;
}
```

### 2.3 CharacterCreationConfig (erweitert)

```typescript
export interface CharacterCreationConfig {
  // Alte Felder (optional, für Fallback)
  specialStart?: number;
  freeSpecialPoints?: number;
  specialMin?: number;
  specialMax?: number;
  extremeValueThreshold?: number;
  
  // Neue generische Felder
  statConfig?: {
    key: string;
    defaultValue?: number;
    min?: number;
    max?: number;
    freePoints?: number;           // frei verteilbare Punkte insgesamt
    extremeThreshold?: number;     // Werte <= threshold brauchen GM-Ok
  }[];
  
  // Bereits generische Felder (bleiben)
  freeSkillPoints: number;
  tagSkillCount: number;
  tagSkillBonus: number;
  skillCapAtCreation: number;
}
```

---

## 3. Migrationspfad

### 3.1 Erkennung

```typescript
function isLegacyCharacter(c: any): boolean {
  return 'special' in c && !('stats' in c);
}
```

### 3.2 Konvertierung

```typescript
function migrateCharacter(c: LegacyCharacter | Character): Character {
  if ('stats' in c) return c as Character; // bereits migriert
  
  const legacy = c as LegacyCharacter;
  return {
    ...legacy,
    stats: { ...legacy.special },         // STR:5, PER:5, …
    resources: {
      hp: legacy.currentHp ?? 0,
      apr: legacy.currentApr ?? 0,
      karma: legacy.karma ?? 0,
    },
    tags: [...legacy.tagSkillIds],
    caps: legacy.caps ?? 0,
    special: undefined,                    // aufräumen
    
    // Alte Felder auf undefined setzen, wenn sie durch neue ersetzt werden
    currentHp: undefined,
    currentApr: undefined,
    karma: undefined,
    tagSkillIds: undefined,
    backgroundAllocations: undefined,
    hunger: undefined,
    thirst: undefined,
    injuredLimbs: undefined,
    crippledLimbs: undefined,
  };
}
```

### 3.3 Wann migrieren?

Beim Laden aus der DB:
```typescript
// in commands.rs → load_characters / load_single_character
// nach dem JSON-Parsing auf TypeScript-Seite in useAppStore.loadAll()
```

```typescript
// in useAppStore.ts
loadAll: async () => {
  const [ruleSets, active, characters] = await Promise.all([…]);
  set({
    characters: characters.map(migrateCharacter),
    …
  });
}
```

### 3.4 derived.ts: Dual-Read

```typescript
function getStats(char: Character): Record<string, number> {
  return char.stats ?? char.special as Record<string, number>;
}

function getStat(char: Character, key: string): number {
  return getStats(char)[key] ?? 0;
}

function getResources(char: Character): Record<string, number> {
  if (char.resources) return char.resources;
  // Fallout-Fallback
  const r: Record<string, number> = {};
  if ('currentHp' in char) r.hp = (char as any).currentHp;
  if ('currentApr' in char) r.apr = (char as any).currentApr;
  if ('karma' in char) r.karma = (char as any).karma;
  return r;
}
```

---

## 4. Datei-für-Datei-Änderungsliste

### Phase 1a – Typen & Migration

| # | Datei | Änderung |
|---|---|---|
| 1 | `src/types/rules.ts` | `UiTemplate`, `UiResourceDef`, `UiPanelDef` Interfaces + `RuleSet.ui` + `CharacterCreationConfig.statConfig` |
| 2 | `src/types/character.ts` | `stats`, `resources`, `tags` zu Character; alte Felder optional; `blankCharacter` nutzt neues Format |
| 3 | `src/lib/migration.ts` (NEU) | `migrateCharacter()` erkennt Alt-Format, konvertiert `special→stats`, `currentHp→resources.hp`, etc. |
| 4 | `src/store/useAppStore.ts` | `loadAll()` ruft `migrateCharacter()` für geladene Charaktere |
| 5 | `src/lib/derived.ts` | `getStats()`, `getResources()` Helper; `getEffectiveSpecial` → `getEffectiveStats` (liest aus `char.stats` + `rules.ui`); alle Formeln nutzen generische Scope-Helfer |

### Phase 1b – derived.ts & Stat-Berechnungen

| # | Datei | Änderung |
|---|---|---|
| 6 | `src/lib/derived.ts` | `getMaxHp` → `getResourceMax(char, rules, "hp")`; `getMaxApr` → `getResourceMax(char, rules, "apr")`; Resource-Formeln aus `rules.formulas` |
| 7 | `src/lib/derived.test.ts` | Tests für `getResourceMax`, `migrateCharacter`, `getStats`, `getResources` |

### Phase 1c – seed_ruleset.json & Examples

| # | Datei | Änderung |
|---|---|---|
| 8 | `src-tauri/src/seed_ruleset.json` | `ui`-Template für Fallout hinzufügen; `characterCreation` um `statConfig` erweitern |
| 9 | `data/examples/dnd5e_ruleset.json` (NEU) | D&D 5e Example mit `ui`-Template, 6 Stats, ~18 Skills |
| 10 | `data/examples/dsa_ruleset.json` (NEU) | DSA Example mit 8 Stats, Talenten, Vor-/Nachteilen |

---

## 5. Risiken & Entscheidungen

### 5.1 Formel-Variablen

**Problem:** Aktuelle Formeln nutzen `STR`, `PER`, `END`, etc. als Variablen. Nach der Abstraktion müssen sie die statKeys aus dem RuleSet nutzen.

**Lösung:** `baseScope()` liefert weiterhin alle statKeys als Variablen. D&D-Formeln nutzen dann `STR`, `DEX`, `CON`, … Die Variablen sind immer die `statKeys` aus dem RuleSet. GM kann im Formel-Editor sehen, welche Variablen verfügbar sind.

### 5.2 Würfelmechanik

**Problem:** Fallout nutzt W10-Pool (mehrere Würfel, roll-under), D&D nutzt W20+Mod (ein Würfel, roll-high).

**Lösung:** In Phase 1 nur Stats abstrahieren, Würfelmechanik bleibt für Phase 2 (UI). Das Würfelterminal bleibt erstmal Fallout-spezifisch.

### 5.3 Alte Charaktere

**Problem:** Nutzer haben ggf. existierende Charaktere in der lokalen SQLite-DB.

**Lösung:** Migration beim Laden. Alle alten Felder bleiben in der DB erhalten (JSON-Blob). Beim nächsten `upsertCharacter` wird das neue Format gespeichert.

### 5.4 Stat-Budget bei Erstellung

**Problem:** D&D nutzt Point-Buy (27 Punkte, Kosten-Tabelle), Standard-Array (15,14,13,12,10,8) oder Würfeln. Fallout nutzt einfaches Start+Free-Points.

**Lösung:** `statConfig[]` enthält `freePoints` (Startwert + frei verteilbar, wie Fallout). Für D&D-Point-Buy bräuchte es eine Kosten-Tabelle im RuleSet – das ist Phase-2-Feinkram. Phase 1 bildet erstmal das Fallout-Modell generisch ab.

### 5.5 `maxHp` / `maxApr` als Formeln

**Problem:** Aktuell heißen die Formeln `maxHp`, `maxApr`, `carryWeight`, `healingRate` – alles Fallout-Begriffe.

**Lösung:** `RuleFormulas` wird um ein generisches `resourceMax: Record<string, string>` erweitert. Alte Felder bleiben als Aliase. Ein D&D-Ruleset könnte `resourceMax.hp = "(CON*6)+10"` haben, `mana` als eigene Formel.

```typescript
interface RuleFormulas {
  // Bisherige (bleiben für Fallback/Kompatibilität)
  maxHp?: string;
  maxApr?: string;
  carryWeight?: string;
  healingRate?: string;
  
  // Neu: generisches Resource-Maximum
  resourceMax?: Record<string, string>;
  
  // Bestehende
  luckBonusDice: string;
  meleeDamageBonus?: string;
  skillPointsPerLevel?: string;
}
```
