# Plan: Generisches Würfelterminal (#3)

## Analyse

### Aktuelle Architektur (Fallout-only)

```
src/lib/dice.ts          src/components/CharacterSheet/DiceRollerPanel.tsx
─────────────────────    ─────────────────────────────────────────────────
rollDicePool()           Skill- + Waffen-Select + Schwierigkeit
rollInitiative()         Deckung + Called Shots + Dauerfeuer
rollArmorCheck()         Rüstungswurf + Sequence
```

3 Fallout-spezifische Konzepte sind hartcodiert:
1. **Würfelmechanik** – d10-Pool, roll-under, Erfolge zählen
2. **Initiative** – PER + d10
3. **Rüstungswurf** – d10 ≤ DR

### Ziel

Drei Würfelmodi über `diceType` im UI-Template konfigurierbar:

| Typ | Systeme | Mechanik |
|---|---|---|
| `"d10-pool"` | Fallout | Pool = Skill + Luck, jeder W10 ≤ Ziel = Erfolg |
| `"d20-plus"` | D&D 5e | d20 + Modifikator ≥ DC |
| `"3d20"` | DSA | 3W20, jeder ≤ Talentwert |

## Plan

### Schritt 1: Typen (`src/types/rules.ts`)

```typescript
export type DiceType = "d10-pool" | "d20-plus" | "3d20";
```

In `UiTemplate`:
```typescript
export interface UiTemplate {
  diceType?: DiceType;  // default: "d10-pool"
  // …
}
```

### Schritt 2: Würfelfunktionen (`src/lib/dice.ts`)

Neue generische Funktionen + Result-Typen:

```typescript
// Gemeinsamer Basis-Typ
interface RollOutcome {
  passed: boolean;
  description: string; // menschenlesbare Beschreibung
}

// d10-pool (Fallout) – bereits vorhanden
interface PoolRollResult { … }

// d20-plus (D&D)
interface D20RollResult extends RollOutcome {
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  advantage: boolean;
  rolls: number[]; // [erster] oder [erster, zweiter]
}
function rollD20(modifier: number, dc: number, advantage?: boolean): D20RollResult

// 3d20 (DSA)
interface ThreeD20RollResult extends RollOutcome {
  rolls: [number, number, number];
  target: number;
  successes: number; // wie viele Würfel ≤ target
}
function roll3d20(target: number): ThreeD20RollResult
```

### Schritt 3: UI-Komponente

`DiceRollerPanel` wird zum Container, der je nach `diceType` eine von drei Sub-Komponenten rendert:

```
DiceRollerPanel
├── diceType === "d10-pool"  → DiceRollerD10Pool  (bestehender Code)
├── diceType === "d20-plus"  → DiceRollerD20Plus  (NEU)
└── diceType === "3d20"      → DiceRoller3D20     (NEU)
```

Gemeinsamer Rahmen (Header, Abschluss-Buttons) bleibt im Container.

### Schritt 4: D&D-Modus (`DiceRollerD20Plus`)

```
Skill/Ability wählen ────────────────────── Select (skills)
DC eingeben ────────────────────────────── Input (default: 15)
Advantage / Disadvantage / Normal ──────── Toggle-Buttons
Waffe wählen (optional) ───────────────── Select (weapons for skill)
──────────────────────────────────────────
[ Würfeln ]
──────────────────────────────────────────
Ergebnis: d20 + Mod = Total vs DC
  Mod = Math.floor((statValue - 10) / 2)
  Bestanden: Total ≥ DC
Schaden: Waffenschaden (fix) bei Treffer
Initiative: d20 + DEX-Mod
```

**VS aktuell (d10-pool):**
- Kein Luck-Bonus, keine natürlichen 1er
- Kein Deckung/Called-Shot (wird durch AC abgedeckt)
- Kein Dauerfeuer
- Kein Rüstungswurf (wird durch AC abgedeckt)

### Schritt 5: DSA-Modus (`DiceRoller3D20`)

```
Talent wählen ──────────────────────────── Select (skills)
Modifikator ────────────────────────────── Input (default: 0)
──────────────────────────────────────────
[ Würfeln ]
──────────────────────────────────────────
Ergebnis: 3W20 gegen Talentwert
  Jeder W20 ≤ Talentwert = Erfolg
  Alle 3 erfolgreich = Talentprobe bestanden
```

### Schritt 6: Fallback

`fallbackUiTemplate()` setzt `diceType: "d10-pool"`.
D&D- und DSA-Beispiel-Rulesets setzen `diceType: "d20-plus"` bzw. `"3d20"`.

### Dateien

| Datei | Änderung |
|---|---|
| `src/types/rules.ts` | `DiceType` + `UiTemplate.diceType` |
| `src/lib/dice.ts` | `rollD20()`, `roll3d20()`, generische Result-Typen |
| `src/lib/dice.test.ts` | Tests für neue Funktionen |
| `src/components/CharacterSheet/DiceRollerPanel.tsx` | Container + 3 Sub-Panels |
| `data/examples/dnd5e_ruleset.json` | `diceType: "d20-plus"` |
| `data/examples/dsa_ruleset.json` | `diceType: "3d20"` |

### Aufwand

~2–3 Sessions:
1. Typen + dice.ts + Tests – 1 Session
2. DiceRollerPanel Umbau (Container + D&D-Panel) – 1 Session
3. DSA-Panel + Beispiel-Rulesets + QA – 1 Session
