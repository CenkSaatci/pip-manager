# PIP-Manager — App-Dokumentation

**Stand:** `feature/character-wizard-and-import` (v0.1.0)  
**App-ID:** `com.cenk.pipmanager`  
**Sprache:** Deutsch (UI, Fehlermeldungen, Kommentare)

---

## Übersicht

Desktop-Anwendung zur Verwaltung von Charakteren und Regelwerken für das **Wasteland-Testregelwerk v0.1** — ein Fallout-Pen&Paper-Homebrew-System (d10-Würfelpool, SPECIAL-Attribute). Läuft auf Windows/macOS/Linux via Tauri 2.

---

## 1. Tech-Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 18.3, TypeScript 5.5 |
| Bundler | Vite 5.3 |
| CSS | TailwindCSS 3.4 (eigenes "Pip"-Designsystem) |
| State | Zustand 4.5 |
| Desktop | Tauri 2.x (Rust) |
| DB | SQLite via rusqlite (bundled) |
| PDF | jsPDF 4.2 (clientseitig) |
| Fonts | VT323 (Display), Share Tech Mono (Monospace) |

---

## 2. Architektur

```
pip-manager/
├── src/                       # React-Frontend
│   ├── types/                 # TypeScript-Typen (character.ts, rules.ts)
│   ├── store/                 # Zustand-Store (useAppStore.ts)
│   ├── lib/                   # Geschäftslogik
│   │   ├── api.ts             # Tauri-IPC + Datei-Dialoge
│   │   ├── derived.ts         # Berechnungen (HP, APR, Skillwerte, …)
│   │   ├── formula.ts         # Formelevaluator (specialBonus, maxHp, …)
│   │   ├── dice.ts            # Würfelmechanik
│   │   ├── pdf.ts             # jsPDF-Export
│   │   └── validators.ts      # JSON-Validierung
│   └── components/
│       ├── Layout.tsx          # App-Shell, Tab-Navigation
│       ├── CharacterList.tsx   # Charakterübersicht
│       ├── CharacterWizard/    # Geführte Charaktererstellung
│       │   └── index.tsx       # 7-Schritte-Assistent
│       ├── CharacterSheet/     # Charakterbogen
│       │   ├── index.tsx       # Hauptseite
│       │   ├── SpecialPanel
│       │   ├── SkillsPanel
│       │   ├── BackgroundPanel
│       │   ├── PerksTraitsPanel
│       │   ├── InventoryPanel
│       │   ├── DiceRollerPanel
│       │   ├── HitLocationPanel
│       │   ├── NeedsPanel
│       │   ├── SessionLogPanel
│       │   ├── LevelUpModal
│       │   └── PrintSheet
│       └── RulesManager/       # Regelwerk-Editor
├── data/examples/              # 10 Beispiel-JSONs für Import-Tests
└── src-tauri/                  # Rust-Backend
    ├── src/db.rs               # SQLite-Tabellen (rulesets, characters)
    ├── src/commands.rs         # 7 Tauri-IPC-Commands
    ├── src/seed_ruleset.json   # Default-Regelwerk (225 Zeilen)
    └── src/lib.rs              # Tauri-Setup, DB-Init
```

### Datenhaltung

RuleSets und Charaktere werden als **JSON-Dokumente in SQLite** gespeichert (kein starres Schema). Das Regelwerk kann sich weiterentwickeln, ohne dass Rust-Strukturen oder Migrationen angepasst werden müssen.

### Navigation

Es gibt **keinen Router**. Die Ansicht wird über ein `view`-Feld im Zustand-Store gesteuert:

- `"characters"` → CharacterList
- `"sheet"` → CharacterSheet (wenn ein Charakter selektiert ist)
- `"rules"` → RulesManager

Umschalten via Tab-Leiste in `Layout.tsx`.

---

## 3. Datenmodell

### Character

```
id, ruleSetId, name, playerName
raceId, backgroundId
level, xp, karma, caps
special: { STR, PER, END, CHA, INT, AGI, LUK }  (jeweils 1–10)
skills: Record<skillId, Punkte>
tagSkillIds, backgroundAllocations
traitIds, perks: [{ perkId, rank }]
inventory: [{ itemId, quantity, equipped }]
currentHp, currentApr
hunger, thirst
injuredLimbs, crippledLimbs
appearance, backstory, notes
sessionLog: [{ id, timestamp, text }]
levelHistory: [{ level, specialAllocations, … }]
createdAt, updatedAt
```

### RuleSet (vollständig konfigurierbar)

Umfasst: SPECIAL-Bereich, Skill-Liste, Rassen (mit Stat-Modifikatoren), Traits (Vor-/Nachteile), Perks (mit Voraussetzungen und Rängen), Items (Waffen/Rüstung/Konsumgüter), Hintergründe (Punkte-Kauf und feste Boni), Testgegner, Trefferzonen, Schwierigkeitsgrade, Level-Progression, Formeln (maxHp, maxApr, Tragkraft, Heilungsrate, etc.), deaktivierbare Mechaniken.

---

## 4. Views & Features

### CharacterList (`/`)
- Karten-Galerie aller Charaktere (Name, Level, Rasse, HP, Caps)
- **Neuer Wanderer (geführt)** → startet den CharacterWizard
- **Schnellerstellung** → leerer Charakter mit Default-SPECIAL
- **Charakter importieren (JSON)** → einzelne Datei
- **Alle exportieren / importieren (Backup)** → Bulk-Operation
- Löschen per Klick (mit Confirmation-Dialog)

### CharacterWizard — **NEU auf diesem Branch**
7-stufiger geführter Assistent zur Charaktererstellung:

1. **Name** — Name + optionaler Spieler-Name
2. **Rasse** — Auswahl mit Stat-Modifikatoren (überspringbar wenn keine Rassen definiert)
3. **SPECIAL** — Punkte-Verteilung mit Budget-Anzeige, Rassen-Mod, Effektivwert, SL-Genehmigung-Warnung für Extremwerte
4. **Hintergrund** — Auswahl mit fixen Boni + Punkte-Kauf-Pools + Tag-Skill-Wahl
5. **Fertigkeiten** — Freie Skillpunkt-Verteilung mit Cap-Prüfung
6. **Traits** — Checkbox-Auswahl mit Vor-/Nachteil-Anzeige
7. **Überprüfen** — Zusammenfassung aller Entscheidungen

Abschluss: Charakter wird gespeichert, Ansicht wechselt zum CharacterSheet.

Steuerung: Schritt-Buttons (zurück zu erledigten Schritten klickbar), Zurück/Weiter-Buttons, Abbrechen.

### CharacterSheet
- Editierbarer Name, Rassen-/Hintergrund-Select
- HP/APR-Balken mit Slider
- SPECIAL-, Skills-, Background-, Perks/Traits-, Inventar-, Trefferzonen-, Bedürfnisse-, Session-Log-Panels
- Notizen-Textarea
- **LevelUpModal** — Levelaufstieg mit SPECIAL/Skill/Tag/Perk-Verteilung
- Drucken & PDF-Export & JSON-Export Buttons
- Würfelterminal (d10-Pool, Waffen, Deckung, Schwierigkeit, Automatikfeuer)

### RulesManager
- Tab-basierter Editor für alle Regelwerk-Kategorien (Meta, Rassen, Skills, Perks, Traits, Items, Hintergründe, Gegner, Level, Trefferzonen, Formeln, Hilfe)
- JSON-Rohbearbeitung mit Validierung
- Import/Export pro Kategorie (Merge-by-ID)
- Undo-Historie (letzte 5 Zustände)
- Vollständiger Hilfereiter mit Feldreferenz

---

## 5. Aktueller Branch: `feature/character-wizard-and-import`

### Neu auf diesem Branch

| Feature | Beschreibung |
|---|---|
| **CharacterWizard** | 7-Schritte-Assistent (siehe 4.) – 584 Zeilen, zentrale Neuerung des Branches |
| **Import-Funktionen** | Einzel-Import (`importJsonFile<Character>`) und Bulk-Import/Export (`exportAll`/`importAll`) in CharacterList |
| **Beispiel-Daten** | `data/examples/` mit 10 JSON-Dateien für jede Regelwerk-Kategorie und `full_ruleset_example.json` |
| **Import-Validierung** | Grundlegende Schema-Prüfung in CharacterList (name, special) |
| **Bulk-Backup-Format** | `{ exportedAt, characters: [...] }` – wird beim Import erkannt |

### Geänderte Dateien (git diff main)

```
src/components/CharacterWizard/index.tsx  (NEU)
src/components/CharacterList.tsx           (erweitert: Wizard, Import/Export)
data/examples/*                            (NEU: 10 JSON-Beispiele)
```

Der Wizard ist über den "Neuer Wanderer (geführt)"-Button in CharacterList erreichbar. Der Import-Button öffnet einen nativen Datei-Dialog, validiert die grundlegende Struktur und speichert den Charakter.

---

## 6. Bekannte Lücken & Ausblick

### Nicht umgesetzte Mechaniken (Regelwerk lässt offen)
- Perk-Effekte aus Abschnitt 23 (Platzhalter)
- Level-Progression (Platzhalter: 5 SP/Level, +1 SPECIAL alle 4 Level)
- Hunger/Durst-Verfall (nur manuelle Zähler)
- Sucht-Mechanik (`addictionChance` existiert, keine Automatik)
- Automatischer Munitionsabzug
- Konsumgüter-Effekte (Stimpak heilt nicht automatisch)
- Kampfbegegnungs-Tracker für Gegner

### Deaktivierbare Mechaniken (per Regelwerk togglebar)
Karma, Ausrüstungszustand, VATS, Cyborg, Synths, kritische Multiplikatoren, Dauerfeuer

### Testabdeckung
- Vitest-Tests für `derived.ts`, `formula.ts`, `dice.ts` (50 Tests, Stand `develop`)

### Build & Dev
```bash
npm run dev           # Vite-Devserver (Port 1420)
npm run build         # tsc + vite build
npm run tauri dev     # Mit Rust-Backend
npm run tauri build   # Produktions-Installer
npm run tauri android dev/build  # Android (erfordert Android Studio + NDK)
npm test              # Vitest (alle Tests)
npm run test:watch    # Vitest im Watch-Modus
```

---

## 7. Multi-System-Abstraktion (abgeschlossen)

Die App ist vollständig abstrahiert. Das Character-Modell nutzt `stats`/`resources`/`tags`.
Jedes RuleSet kann ein `ui`-Template definieren, das Stats, Resources, Panels, Wizard-Schritte, Würfelmechanik und Theme steuert.

**Umgesetzt:**
- Character-Modell generisch (`stats`/`resources`/`tags`)
- RuleSet.ui-Template (Stats, Resources, Panels, Wizard, DiceType, Theme)
- Migration alter Charaktere
- Theme-System (4 Built-in + Custom-Import)
- Würfelterminal generisch (d10-pool, d20-plus, 3d20)
- i18n: DE/EN/FR/IT/ES/TR

## 8. System Creation Wizard (geplant)

Ein geführter Assistent, der ohne JSON-Kenntnisse ein neues RuleSet + UiTemplate erstellt.

### Konzept

5 Schritte, in denen der User perCheckboxen, Dropdowns und Eingabefeldern sein Wunschsystem zusammenstellt:

**Schritt 1 – Basis**
- Systemname, Beschreibung, Version
- Währung (Dropdown + eigener Eintrag)
- Theme (Dropdown)

**Schritt 2 – Attribute**
- Anzahl Attribute (3–12 per Slider)
- Pro Attribut: Name, Kürzel, Min/Max, Startwert, Extremwert-Schwelle
- Attribut-Bonus-Formel (Dropdown: `specialBonus(x)` für Fallout, `Math.floor((x-10)/2)` für D&D, eigene)

**Schritt 3 – Mechaniken**
- Würfeltyp (d10-pool, d20+mod, 3d20)
- Resources: ☑ HP, ☐ Mana, ☑ Karma, ☐ Rüstungspunkte, …
- ☐ Rüstungswurf, ☐ Automatikfeuer, ☐ Deckung, ☐ Gezielte Treffer

**Schritt 4 – Panels & Wizard**
- Aktivierte Panels: ☑ Skills, ☑ Perks, ☑ Traits, ☑ Inventar, ☑ Würfelterminal, ☐ Trefferzonen, ☐ Bedürfnisse, ☐ Zauber
- Wizard-Schritte: ☑ Rasse, ☑ Hintergrund, ☑ Traits
- ☑ Boni-Skills (Anzahl, Bonus pro Skill)

**Schritt 5 – Review & Export**
- Vollständige Vorschau des generierten JSON
- Buttons: "Als JSON exportieren", "Direkt ins aktive Regelwerk importieren"

### Technische Umsetzung

Ein React-Component `SystemWizard` in `src/components/SystemWizard/index.tsx`
baut ein `RuleSet`-Objekt zusammen und gibt es als JSON aus oder importiert es direkt via `upsertRuleSet`.

Keine neuen Typen nötig – das bestehende `RuleSet` + `UiTemplate` wird befüllt.

### Aufwand

~3–5 Sessions:
1. Basis-Schritt + Attribut-Schritt – 1 Session
2. Mechaniken + Panels – 1 Session
3. Review + Export/Import – 1 Session
4. Feinschliff + Tests – 1 Session

