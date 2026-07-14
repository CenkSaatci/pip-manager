# Byte & Dice

Multi-System Tabletop Character Manager. Erstelle und verwalte Charaktere
für jedes Pen & Paper Regelwerk – Fallout, D&D 5e, Das Schwarze Auge und
eigene Systeme. Tauri 2.x + React/TypeScript/TailwindCSS im Frontend,
Rust + SQLite im Backend.

Das komplette Regelwerk ist zur Laufzeit per JSON editierbar, import- und
exportierbar. Ändert sich etwas an den Hausregeln, muss dafür keine Zeile
Code angefasst werden.

## Setup

Voraussetzungen: Node.js ≥ 18, Rust (stable, via rustup), sowie die
[Tauri-Systemabhängigkeiten](https://tauri.app/start/prerequisites/) für
dein Betriebssystem (unter Linux u.a. `libwebkit2gtk-4.1-dev`, unter
Windows die WebView2-Runtime, unter macOS Xcode Command Line Tools).

```bash
npm install
npm run tauri dev      # Entwicklungsmodus mit Hot Reload
npm run tauri build    # Produktions-Build (Installer für dein OS)
```

Frontend-Typecheck/Build wurden bereits gegen dieses Regelwerk verifiziert
(`npx tsc --noEmit` und `npx vite build` laufen sauber durch). Der
Rust-Teil konnte in meiner Umgebung nicht kompiliert werden (kein Cargo
verfügbar) — beim ersten `npm run tauri dev` lädt Cargo die Abhängigkeiten
selbstständig nach.

Icons in `src-tauri/icons/` sind aktuell nur Platzhalter (grüner Pip-Boy-
Kreis). Für einen sauberen App-Icon-Satz (inkl. `.icns` für macOS):

```bash
npm run tauri icon pfad/zu/deinem/logo.png
```

## Umgesetztes Regelwerk (aus eurer Word-Datei)

- **Würfelpool:** Anzahl Würfel = Skillwert + Luck-Bonus. Jeder W10 ≤
  Zielwert ist ein Erfolg, eine natürliche 1 zählt immer als Erfolg.
- **SPECIAL-Bonus-Tabelle:** 1–4 → +0, 5–7 → +1, 8–9 → +2, 10 → +3
  (Funktion `specialBonus(x)` in allen Formeln verfügbar).
- **HP** = (STR + END) × 5. **APR** = 1 + SPECIAL-Bonus(AGI).
  **Luck-Bonus-Würfel** = SPECIAL-Bonus(LUK).
- **Charaktererstellung:** SPECIAL startet bei 5, +5 frei verteilbare
  Punkte (Senken erlaubt), Werte ≤ 2 markieren als "SL-Genehmigung nötig".
  Skills starten über SPECIAL-Bonus, danach Hintergrundpaket, 8 freie
  Skillpunkte, 3 Tag-Skills (+1 je Skill), Startmaximum 6.
- **Hintergründe:** Bürger & Ödländer als Punkte-Kauf (6 Punkte, max. +2/
  Skill aus einer Liste), Militär/NCR & Bruderschaft mit festen Boni;
  Bruderschaft zusätzlich mit Meistergenehmigung-Flag und einer Wahl
  zwischen Langwaffen/Schwere Waffen.
- **Kampf:** Schaden = Waffenschaden (fixer Wert, keine Würfelnotation) +
  Erfolge. Rüstung: 1W10 gegen DR, bei Erfolg kompletter Block statt
  Schadensreduktion. Deckung und Schwierigkeitsgrade wirken als
  Zielwert-Malus.
- **Bewusst abgeschaltete Mechaniken** (Abschnitt 24 eurer Datei) sind im
  Regelwerk-Reiter einzeln togglebar: Karma, Ausrüstungszustand, VATS,
  Cyborg, Synths, kritische Multiplikatoren, Dauerfeuer. Ist eine
  Mechanik deaktiviert, blendet die App das zugehörige UI aus (aktuell
  für Karma umgesetzt, weitere Panels lassen sich analog ergänzen).
- **Testgegner** (Abschnitt 25) liegen als eigene Liste im Regelwerk-Reiter
  und lassen sich für schnelle Kampftests nachschlagen.

Nicht im Regelwerk enthalten (weil in eurer Datei explizit offen gelassen)
und daher nur als Platzhalter vorhanden: Levelaufstiegs-Formel jenseits der
Charaktererstellung, mechanische Ausgestaltung der Perks aus Abschnitt 23,
Trefferzonen-Mechanik, Sucht/Hunger/Durst-Verfall. Datenfelder dafür
existieren teilweise schon (`injuredLimbs`, `hunger`, `thirst`), aber ohne
Automatik — die App zeigt sie an, rechnet aber nichts automatisch damit.

## Architektur

```
src/                      React-Frontend
  types/rules.ts          TS-Typen für das komplette Regelwerk (RuleSet)
  types/character.ts      TS-Typen für Charaktere
  lib/formula.ts          Wertet Regelwerk-Formeln aus, inkl. specialBonus(x)
  lib/derived.ts          HP, APR, Traglast, Skillwerte, Würfelpoolgröße, Perk-Voraussetzungen
  lib/dice.ts             W10-Würfelpool, Initiative, Rüstungswurf
  lib/api.ts              Aufrufe an das Rust-Backend + Datei-Dialoge
  store/useAppStore.ts    Zustand (aktives Regelwerk, Charakterliste, Auswahl)
  components/             UI: Charakterliste, Charakterbogen, Regelwerk-Editor

src-tauri/                Rust-Backend
  src/db.rs               SQLite-Anbindung (lokale Datei im App-Datenverzeichnis)
  src/commands.rs         Tauri-Commands (CRUD für RuleSets & Charaktere)
  src/seed_ruleset.json   Euer Wasteland-Testregelwerk v0.1, wird beim ersten Start geladen

data/examples/            Das Regelwerk als einzelne JSON-Dateien pro Kategorie, zum Testen des Imports
```

**Design-Entscheidung:** RuleSets und Charaktere werden als JSON-Dokumente
in SQLite gespeichert (kein starres relationales Schema). Das Regelwerk
kann sich beliebig weiterentwickeln (neue Item-Felder, weitere Traits,
Perk-Mechaniken), ohne DB-Migrationen oder Rust-Structs anzupassen — die
Typprüfung passiert im TypeScript-Frontend.

## Regelwerk als JSON erweitern

Im Reiter **Regelwerk** lässt sich jede Liste (Skills, Rassen, Perks,
Traits, Items, Hintergründe, Testgegner) einzeln als JSON importieren/
exportieren, komplett als Rohtext bearbeiten, oder das ganze Regelwerk auf
einmal austauschen. Beispiele liegen in `data/examples/`.

Wichtige Formel-Variablen (Reiter "Übersicht & Formeln"): `STR, PER, END,
CHA, INT, AGI, LUK, level, karma`, plus die Funktion `specialBonus(x)`.

## Weitere Features (Stand: aktueller Ausbau)

- **Trefferzonen:** eigener Reiter "Trefferzonen" im Regelwerk (Zone + Zielmalus, editierbar).
  Im Charakterbogen ein Klick-Tracker (gesund → verwundet → verkrüppelt) pro Zone, im
  Würfelterminal als "Zielzone"-Dropdown für gezielte Treffer nutzbar.
- **Dauerfeuer:** taucht im Würfelterminal automatisch auf, sobald eine Waffe mit
  `isAutomatic: true` gewählt ist. Rechnet `burstDamageBonus` zum Schaden dazu und zeigt den
  Munitionsverbrauch (`burstAmmoCost`) an — Munition wird aktuell nicht automatisch aus dem
  Inventar abgezogen.
- **Bedürfnisse:** einfacher Hunger-/Durst-Zähler mit +/- und einem "Neuer Tag"-Sammel-Button.
  Bewusst ohne automatische Konsequenzen, da das Regelwerk dafür noch keine Werte vorgibt.
- **Druckansicht:** Button "Drucken" im Charakterbogen öffnet den System-Druckdialog mit einer
  kompakten, schwarz-auf-weiß optimierten Einzelseiten-Übersicht (SPECIAL, Skills, Perks/Traits,
  angelegte Ausrüstung, Hintergrund).
- **Session-Log:** eigener Bereich unterhalb der Notizen mit Zeitstempel je Eintrag, unabhängig
  vom freien Hintergrundtext.
- **Sammel-Backup:** "Alle exportieren"/"Alle importieren" in der Wanderer-Übersicht sichert bzw.
  lädt alle Charaktere auf einmal in eine Datei (Import gleicht nach `id` ab wie bei den
  Regelwerk-Listen).
- **Undo im Regelwerk-Editor:** jede Kategorie merkt sich die letzten 5 Zustände; ein
  "↺ Rückgängig"-Button erscheint, sobald etwas zum Zurücknehmen da ist.
- **Import-Validierung:** grundlegende Schema-Prüfung (Pflichtfelder, gültige SPECIAL-Kürzel,
  bekannte Item-Typen, `damage` muss eine Zahl sein) mit klaren Fehlermeldungen statt kryptischer
  Folgefehler im Charakterbogen.
- **Trait-Effekte werden jetzt automatisch eingerechnet:** `benefits`/`drawbacks` mit Ziel
  `STR/PER/END/CHA/INT/AGI/LUK`, einer Skill-ID oder `maxHp`/`maxApr`/`carryWeight`/`healingRate`
  fließen direkt in die jeweiligen Werte ein (vorher nur zur Anzeige). Nebenbei behoben: SPECIAL-
  Boni aus Rasse/Traits fließen jetzt auch korrekt in Skill-Basiswerte und alle Formeln ein (vorher
  wurden dort nur die rohen SPECIAL-Werte verwendet).

## PDF-Export

Der Button "Als PDF speichern" im Charakterbogen erzeugt ein echtes PDF
(nicht nur "Drucken als PDF" über den Systemdialog) mit `jsPDF` — komplett
clientseitig, ohne Server, funktioniert also identisch auf Desktop und
Mobile. Der Inhalt (SPECIAL, Kernwerte, Fertigkeiten, Perks/Traits,
Ausrüstung, Hintergrund) entspricht der Druckansicht, ist aber direkt
programmatisch aufgebaut statt aus dem DOM gerendert — dadurch zuverlässiger
bei Sonderzeichen/Umlauten und ohne Layout-Überraschungen.

## Mobile / Android

Der Code ist jetzt strukturell mobile-tauglich:

- **`src-tauri/src/lib.rs`** enthält die komplette App-Logik mit
  `#[cfg_attr(mobile, tauri::mobile_entry_point)]` — dem Standard-Tauri-2-
  Muster, bei dem Android/iOS denselben Rust-Code über einen nativen
  Einstiegspunkt laden. `main.rs` ist nur noch ein dünner Wrapper für den
  klassischen Desktop-Build.
- **Datenbankpfad** wird jetzt über Tauris eigenen, plattformübergreifenden
  Path-Resolver (`app.path().app_data_dir()`) ermittelt statt über die
  `dirs`-Crate, die auf Android keine sinnvollen Pfade liefert. Das war
  vorher ein einfacher, aber echter Blocker für Android.
- `tauri-plugin-dialog` und `tauri-plugin-fs` (für JSON-/PDF-Import-Export)
  unterstützen laut Tauri-Dokumentation offiziell Android; auf Android läuft
  der Datei-Dialog über das System-eigene Storage-Access-Framework.

**Was ich NICHT verifizieren konnte**, weil in meiner Umgebung weder Cargo
noch ein Android SDK/NDK verfügbar sind: dass das Ganze tatsächlich
kompiliert und auf einem Android-Gerät/Emulator läuft. Das kann nur auf
deinem Rechner getestet werden.

### Einmaliges Setup (auf deinem Rechner)

Voraussetzungen zusätzlich zu den Desktop-Voraussetzungen:

1. [Android Studio](https://developer.android.com/studio) installieren
   (bringt SDK + NDK + Emulator mit).
2. Umgebungsvariablen setzen (Beispiel Windows, Pfade ggf. anpassen):
   ```
   ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
   NDK_HOME=%ANDROID_HOME%\ndk\<installierte-version>
   ```
3. Rust-Android-Targets installieren:
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
   ```
4. Android-Projekt generieren (einmalig, legt `src-tauri/gen/android` an):
   ```bash
   npm run tauri android init
   ```

### Entwickeln & Bauen

```bash
npm run tauri android dev     # auf verbundenem Gerät/Emulator, mit Hot Reload
npm run tauri android build   # signierte/unsignierte APK für die Weitergabe
```

### Bekannte Stolpersteine, auf die du achten solltest

- Falls `tauri android init` eine eigene `capabilities`-Datei für Mobile
  anlegt: prüfen, ob die Berechtigungen aus
  `src-tauri/capabilities/default.json` (Dialog- und Dateisystemzugriff)
  dort ebenfalls greifen — sonst schlägt der JSON-/PDF-Import-Export auf
  Android fehl.
- `rusqlite` mit dem `bundled`-Feature kompiliert SQLite beim Bauen aus C-
  Quellcode mit; das braucht ein funktionierendes NDK-Toolchain-Setup,
  läuft in der Praxis aber bei den meisten Tauri+SQLite-Mobile-Projekten
  ohne Zusatzaufwand.
- Die UI (Tailwind-Grids) ist responsiv angelegt (Spalten reduzieren sich
  automatisch auf schmalen Bildschirmen), wurde aber nicht auf einem
  echten Gerät gegengetestet. Falls einzelne Panels auf einem Handy zu
  gedrängt wirken (z.B. das Würfelterminal mit vielen Dropdowns
  nebeneinander), sag Bescheid — das lässt sich gezielt nachschärfen,
  sobald wir sehen, wo es klemmt.

## Nächste sinnvolle Ausbauschritte

1. **Perks aus Abschnitt 23** (Ranger-Ausbildung, Feldsanitäter, Scharfschütze, …)
   mechanisch ausgestalten, sobald ihr die Effekte festlegt — die Einträge
   existieren schon als Platzhalter im Regelwerk.
2. **Levelaufstiegs-Tabelle** (`levelProgression`) enthält aktuell nur
   Platzhalterwerte (5 Skillpunkte/Level, +1 SPECIAL alle 4 Level, ab
   Level 3 ein Perk-Slot) — im Regelwerk-Reiter unter "Levelaufstieg"
   anpassen, sobald ihr die echten Werte festlegt. Der Levelaufstiegs-
   Assistent im Charakterbogen (Button "Level Up") liest diese Tabelle
   direkt aus und lässt SPECIAL, Skills, Tag-Skills und Perks pro Level
   gezielt verteilen — inklusive Voraussetzungsprüfung für Perks und
   einer Historie (`levelHistory` am Charakter), damit nichts doppelt
   vergeben wird.
3. **Trefferzonen/Called-Shots** als eigenes UI im Würfelterminal ergänzen
   (Datenfelder `injuredLimbs`/`crippledLimbs` existieren bereits).
4. **Automatikfeuer-Button** im Würfelterminal (Munition/Bonus sind bereits
   pro Waffe hinterlegt: `isAutomatic`, `burstAmmoCost`, `burstDamageBonus`).

## Hilfe direkt in der App

Der Regelwerk-Reiter hat einen eigenen **❓ Hilfe**-Tab mit Feldreferenz und
JSON-Beispielen für jede Kategorie (Rassen, Skills, Perks, Traits, Items,
Hintergründe, Testgegner, Levelaufstieg, Formeln) sowie einer Erklärung,
wie Import/Export genau funktioniert:

- **Kategorie-Import** (z.B. "Rassen importieren") gleicht nach `id` ab:
  vorhandene Einträge werden aktualisiert, neue ergänzt, der Rest bleibt
  erhalten.
- **"Als JSON bearbeiten"** ersetzt die Liste 1:1 durch das, was du dort
  eintippst.
- **"Komplettes Regelwerk importieren"** überschreibt ein Regelwerk mit
  gleicher `id` komplett, oder legt bei neuer `id` ein zusätzliches
  Regelwerk an.
