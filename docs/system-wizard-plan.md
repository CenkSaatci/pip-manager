# System Creation Wizard – Implementierungsplan

## Überblick

Ein 5-Schritte-Assistent, der ohne JSON-Kenntnisse ein RuleSet + UiTemplate erstellt.
Jeder Schritt sammelt Daten in einem `draft`-Objekt. In Schritt 5 wird daraus ein
fertiges RuleSet generiert und als JSON exportiert oder direkt importiert.

## Schritt 1 – Basis

**UI:** Einfaches Formular mit Eingabefeldern + Dropdowns

```
┌──────────────────────────────────────────┐
│ Systemname: [________________]           │
│ Version:    [0.1        ▼]               │
│ Beschreibung: [________________]          │
│ Währung:    [Caps ▼] oder eigen: [___]   │
│ Theme:      [Pip-Boy ▼]                  │
│ Würfeltyp:  [d10-pool (Fallout) ▼]       │
│                                           │
│           [Weiter →]                     │
└──────────────────────────────────────────┘
```

**Draft-Aktualisierung:**
```typescript
draft.name = name;
draft.ui.currencyLabel = currencyLabel;
draft.ui.theme = theme;
draft.ui.diceType = diceType;
```

## Schritt 2 – Attribute

**UI:** Dynamische Tabelle mit Slider für Anzahl + editierbaren Zeilen

```
┌──────────────────────────────────────────┐
│ Anzahl Attribute: [6 —═══●═══— 12]      │
│ ┌───┬────────┬─────┬────┬────┬─────┬──┐ │
│ │ # │ Kürzel │Name │Min │Max │Start│Ex│ │
│ ├───┼────────┼─────┼────┼────┼─────┼──┤ │
│ │ 1 │ STR    │Stär │  1 │ 10 │  5  │ 2│ │
│ │ 2 │ DEX    │Ges  │  1 │ 10 │  5  │ 2│ │
│ │ … │        │     │    │    │     │  │ │
│ └───┴────────┴─────┴────┴────┴─────┴──┘ │
│ Bonus-Formel: [specialBonus(x)      ▼]  │
│ Freie Punkte: [5]                       │
│                                           │
│       [Zurück]              [Weiter →]   │
└──────────────────────────────────────────┘
```

**Presets:** "Fallout laden" → 7 SPECIALs
"DD laden" → 6 D&D-Attribute
"DSA laden" → 8 DSA-Eigenschaften

**Draft:**
```typescript
draft.ui.stats = configs;
draft.ui.statsLabel = label;
draft.characterCreation.freeSpecialPoints = freePoints;
draft.formulas.bonusFormula = bonusFormula;
```

## Schritt 3 – Mechaniken

**UI:** Checkbox-Grid + je nach Auswahl weitere Optionen

```
┌──────────────────────────────────────────┐
│ Resources:                               │
│ ☑ HP (Trefferpunkte)                     │
│     Formel: [(STR+END)*5          ▼]     │
│ ☐ Mana                                   │
│ ☑ Karma  ☐ Rüstungspunkte               │
│                                           │
│ Combat:                                  │
│ ☑ Rüstungswurf (1W10 ≤ DR)              │
│ ☑ Automatikfeuer                         │
│ ☑ Deckungs-Malus                         │
│ ☐ Gezielte Treffer (Trefferzonen)       │
│                                           │
│ Attribute/Fertigkeiten:                  │
│ Freie Skillpunkte: [8]                   │
│ Skill-Startmaximum: [6]                  │
│                                           │
│       [Zurück]              [Weiter →]   │
└──────────────────────────────────────────┘
```

**Draft:**
```typescript
draft.ui.resources = resources;
draft.formulas.maxHp = hpFormula;
draft.characterCreation.freeSkillPoints = freeSkillPoints;
draft.characterCreation.skillCapAtCreation = skillCap;
```

## Schritt 4 – Panels & Wizard

**UI:** Checkboxen für Panels + Wizard-Schritte

```
┌──────────────────────────────────────────┐
│ Panels:                                  │
│ ☑ Fertigkeiten  ☑ Perks  ☑ Traits       │
│ ☑ Inventar      ☑ Würfelterminal         │
│ ☐ Trefferzonen  ☐ Bedürfnisse            │
│ ☐ Zauber/Magie                           │
│                                           │
│ Wizard-Schritte:                         │
│ ☑ Rasse auswählen                        │
│ ☑ Hintergrund auswählen                  │
│ ☐ Traits auswählen                        │
│ ☑ Boni-Skills (Tag-Skills)               │
│     Anzahl: [3]  Bonus pro Skill: [1]    │
│                                           │
│       [Zurück]              [Weiter →]   │
└──────────────────────────────────────────┘
```

**Draft:**
```typescript
draft.ui.panels = panels;
draft.ui.wizardSteps = wizardSteps;
draft.characterCreation.tagSkillCount = tagSkillCount;
draft.characterCreation.tagSkillBonus = tagSkillBonus;
```

## Schritt 5 – Review & Export

**UI:** JSON-Vorschau + Buttons

```
┌──────────────────────────────────────────┐
│ 📋 Vorschau des generierten Regelwerks   │
│ ┌──────────────────────────────────────┐ │
│ │ {                                   │ │
│ │  "name": "Mein System",            │ │
│ │  "ui": { ... },                    │ │
│ │  "formulas": { ... },              │ │
│ │  ...                               │ │
│ │ }                                  │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ [📥 Als JSON exportieren]                 │
│ [📥 Direkt importieren]                  │
│                                           │
│       [Zurück]          [Fertig]          │
└──────────────────────────────────────────┘
```

## Implementierung

### Dateien

| Datei | Neu/Änderung | Beschreibung |
|---|---|---|
| `src/components/SystemWizard/index.tsx` | NEU | Hauptkomponente, 5 Schritte |
| `src/components/SystemWizard/StepBasics.tsx` | NEU | Schritt 1: Basis-Daten |
| `src/components/SystemWizard/StepStats.tsx` | NEU | Schritt 2: Attribute |
| `src/components/SystemWizard/StepMechanics.tsx` | NEU | Schritt 3: Mechaniken |
| `src/components/SystemWizard/StepPanels.tsx` | NEU | Schritt 4: Panels & Wizard |
| `src/components/SystemWizard/StepReview.tsx` | NEU | Schritt 5: Review & Export |
| `src/components/RulesManager/index.tsx` | ÄNDERUNG | Button "+ System-Assistent" |
| `src/lib/defaultRuleset.ts` | NEU | Baut leeres RuleSet mit UiTemplate |

### Ablauf

1. User klickt "+ System-Assistent" im RulesManager
2. `SystemWizard` öffnet sich als Modal (wie CharacterWizard)
3. User durchläuft 5 Schritte
4. In Schritt 5: Export als JSON-Datei oder direkt via `upsertRuleSet` importieren

### Datenmodell (intern)

```typescript
interface SystemDraft {
  name: string;
  version: string;
  description: string;
  currencyLabel: string;
  theme: string;
  diceType: DiceType;
  statsLabel: string;
  stats: StatConfig[];
  bonusFormula: string;
  freeSpecialPoints: number;
  resources: UiResourceDef[];
  hpFormula: string;
  panels: UiTemplate["panels"];
  wizardSteps: UiTemplate["wizardSteps"];
  tagSkillCount: number;
  tagSkillBonus: number;
  freeSkillPoints: number;
  skillCapAtCreation: number;
}
```

### Build-Funktion

```typescript
function buildRuleSet(draft: SystemDraft): RuleSet {
  const id = crypto.randomUUID();
  return {
    id, name: draft.name, version: draft.version,
    diceSystem: "...",
    specialRange: [1, 10], skillRange: [0, 10], karmaRange: [-10, 10],
    disabledMechanics: [],
    characterCreation: {
      specialStart: draft.stats[0]?.defaultValue ?? 5,
      freeSpecialPoints: draft.freeSpecialPoints,
      specialMin: Math.min(...draft.stats.map(s => s.min ?? 1)),
      specialMax: Math.max(...draft.stats.map(s => s.max ?? 10)),
      extremeValueThreshold: 2,
      freeSkillPoints: draft.freeSkillPoints,
      tagSkillCount: draft.tagSkillCount,
      tagSkillBonus: draft.tagSkillBonus,
      skillCapAtCreation: draft.skillCapAtCreation,
    },
    levelProgression: [{ level: 2, skillPoints: 5 }],
    hitLocations: [],
    formulas: {
      maxHp: draft.hpFormula,
      maxApr: "1",
      carryWeight: "STR*15",
      healingRate: "1",
      luckBonusDice: "0",
      skillPointsPerLevel: "5",
      bonusFormula: draft.bonusFormula,
    },
    difficultyLevels: [
      { name: "Normal", penalty: 0, successesRequired: 1 },
    ],
    skills: [], races: [], traits: [], perks: [], backgrounds: [], items: [], enemies: [],
    ui: {
      statsLabel: draft.statsLabel,
      currencyLabel: draft.currencyLabel,
      diceType: draft.diceType,
      theme: draft.theme,
      stats: draft.stats,
      resources: draft.resources,
      panels: draft.panels,
      wizardSteps: draft.wizardSteps,
    },
  };
}
```
