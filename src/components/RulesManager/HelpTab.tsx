const SPECIAL_HINT = "Die Stat-Kürzel richten sich nach dem UI-Template des Regelwerks. Für Fallout: STR, PER, END, CHA, INT, AGI, LUK. Nur abweichende Werte angeben, alles andere bleibt 0.";

interface DocEntry {
  title: string;
  intro?: string;
  example: string;
  fields: { name: string; desc: string }[];
}

const DOCS: DocEntry[] = [
  {
    title: "Multi-System (UI-Template)",
    intro: "PIP-Manager unterstützt mehrere Regelwerke nebeneinander. Jedes RuleSet kann ein eigenes UI-Template mitbringen, das Aussehen und Verhalten der App steuert – ohne Codeänderung.",
    example: `{
  "ui": {
    "statsLabel": "Attribute",
    "currencyLabel": "GM",
    "diceType": "d20-plus",
    "stats": [
      { "key": "STR", "label": "Stärke", "min": 3, "max": 20 },
      { "key": "DEX", "label": "Geschick", "min": 3, "max": 20 }
    ],
    "resources": [
      { "key": "hp", "label": "TP", "formula": "maxHp", "color": "red" }
    ],
    "panels": {
      "hitLocations": { "enabled": false, "label": "Trefferzonen" },
      "needs": { "enabled": false, "label": "Bedürfnisse" }
    },
    "wizardSteps": { "traits": false }
  }
}`,
    fields: [
      { name: "statsLabel", desc: "Überschrift über den Stats (z.B. 'Attribute', 'Eigenschaften')." },
      { name: "currencyLabel", desc: "Währungsbezeichnung (z.B. 'Caps', 'GM', 'Dukaten')." },
      { name: "diceType", desc: "Würfelmechanik: 'd10-pool' (Fallout), 'd20-plus' (D&D), '3d20' (DSA)." },
      { name: "stats[].key/label/min/max", desc: "Definition der Stats (Attributs-Kürzel, Anzeigename, Bereich)." },
      { name: "resources[].formula", desc: "Formel-Name aus dem formulas-Block, z.B. 'maxHp' für den Maximalwert." },
      { name: "panels.{name}.enabled", desc: "true/false – blendet optionale Panels (Trefferzonen, Bedürfnisse) ein/aus." },
      { name: "wizardSteps", desc: "Optional: blendet Wizard-Schritte aus. Mögliche Keys: race, background, traits." },
    ],
  },
  {
    title: "Rassen",
    intro: `statModifiers ist ein Objekt Stat-Kürzel -> Zahl. ${SPECIAL_HINT}`,
    example: `{
  "id": "ghoul",
  "name": "Ghul",
  "statModifiers": { "END": 1, "CHA": -1 },
  "specialAbilities": ["Strahlenresistent"],
  "carryWeightModifier": 0
}`,
    fields: [
      { name: "statModifiers", desc: "SPECIAL-Boni/Mali der Rasse, z.B. { \"STR\": 1 }." },
      { name: "specialAbilities", desc: "Freitext-Liste, rein informativ (kein Mechanik-Effekt)." },
      { name: "carryWeightModifier", desc: "Fester Zuschlag/Abzug auf die Traglast in kg." },
      { name: "startingTraitIds", desc: "Optional: IDs von Traits, die die Rasse automatisch mitbringt." },
    ],
  },
  {
    title: "Fertigkeiten (Skills)",
    intro: "baseFormula wird als JS-Ausdruck ausgewertet. Verfügbare Variablen: alle Stats + level + karma + Funktion specialBonus(x).",
    example: `{
  "id": "handfeuerwaffen",
  "name": "Handfeuerwaffen",
  "governingStat": "AGI",
  "baseFormula": "specialBonus(AGI)",
  "alternateStats": ["PER"]
}`,
    fields: [
      { name: "governingStat", desc: "Haupt-Attribut des Skills (Stat-Kürzel aus dem UI-Template)." },
      { name: "baseFormula", desc: "JS-Ausdruck für den Startwert, z.B. \"specialBonus(AGI)\" oder \"specialBonus(AGI)+1\"." },
      { name: "alternateStats", desc: "Optional, rein informativ, falls laut Regelwerk mehrere Attribute passen." },
    ],
  },
  {
    title: "Perks",
    intro: "requirements steuert, ob ein Spieler den Perk im Charakterbogen wählen darf.",
    example: `{
  "id": "toughness",
  "name": "Zähigkeit",
  "maxRanks": 3,
  "requirements": {
    "level": 3,
    "stats": { "END": 6 },
    "skills": { "ueberleben": 4 },
    "perkIds": ["andere_perk_id"],
    "requiresGmApproval": false
  }
}`,
    fields: [
      { name: "maxRanks", desc: "Wie oft der Perk gewählt werden kann (Ränge)." },
      { name: "requirements.level", desc: "Mindest-Charakterlevel." },
      { name: "requirements.stats", desc: "Mindest-Stat-Werte (Stat-Kürzel aus dem UI-Template)." },
      { name: "requirements.skills", desc: "Mindest-Skillwerte, Key = Skill-ID." },
      { name: "requirements.perkIds", desc: "Andere Perks, die vorher gewählt sein müssen." },
      { name: "requirements.requiresGmApproval", desc: "true = Perk ist im UI immer wählbar, aber mit Hinweis 'SL-Genehmigung nötig'." },
    ],
  },
  {
    title: "Traits",
    intro: "Jeder Trait hat einen Vorteil UND einen gleichwertigen Nachteil (nicht automatisch verrechnet, nur zur Anzeige).",
    example: `{
  "id": "kleiner_koerperbau",
  "name": "Kleiner Körperbau",
  "benefits": [{ "target": "AGI", "amount": 1 }],
  "drawbacks": [{ "target": "carryWeight", "amount": -25, "note": "reduzierte Traglast" }]
}`,
    fields: [
      { name: "benefits / drawbacks", desc: "Listen von { target, amount, note? }. target ist ein Stat-Kürzel, Skill-ID oder Stichwort wie 'maxHp'." },
      { name: "Hinweis", desc: "Diese Effekte werden aktuell nur angezeigt, nicht automatisch in Formeln eingerechnet." },
    ],
  },
  {
    title: "Items",
    intro: "type bestimmt, welche Felder relevant sind: weapon, armor, consumable, ammo, misc.",
    example: `{
  "id": "10mm_pistole",
  "name": "10mm Pistole",
  "type": "weapon",
  "weight": 1.5,
  "value": 120,
  "damage": 5,
  "skillId": "handfeuerwaffen",
  "isAutomatic": false
}`,
    fields: [
      { name: "damage", desc: "Fixer Zahlenwert (kein Würfelausdruck!). Schaden = damage + Erfolge aus dem Angriffswurf." },
      { name: "skillId", desc: "Welcher Skill für Angriffe mit dieser Waffe genutzt wird (steuert die Waffenauswahl im Würfelterminal)." },
      { name: "damageResistance", desc: "Nur für Rüstung: DR-Wert für den Rüstungswurf (1W10 ≤ DR blockt)." },
      { name: "requiresTraining", desc: "z.B. Power Armor: markiert, dass ohne passenden Perk Mali gelten (aktuell nur informativ)." },
      { name: "isAutomatic / burstAmmoCost / burstDamageBonus", desc: "Für Dauerfeuer-Waffen, aktuell nur Datenfelder ohne eigenes Button-UI." },
    ],
  },
  {
    title: "Hintergründe",
    intro: "Zwei Bonus-Arten: fixedSkillBonuses (garantiert) und pointBuyPools (Spieler verteilt selbst, im Charakterbogen).",
    example: `{
  "id": "buerger",
  "name": "Bürger",
  "fixedSkillBonuses": { "bildung": 1 },
  "pointBuyPools": [{
    "poolName": "Bürger-Punkte",
    "points": 6,
    "maxPerSkill": 2,
    "eligibleSkillIds": ["bildung", "handel", "wissenschaft"]
  }],
  "requiresGmApproval": false
}`,
    fields: [
      { name: "fixedSkillBonuses", desc: "Skill-ID -> fester Bonus, den jeder mit diesem Hintergrund automatisch bekommt." },
      { name: "pointBuyPools", desc: "Liste von Punkte-Töpfen. Der Spieler verteilt die Punkte selbst im Charakterbogen (Hintergrund-Panel)." },
      { name: "pointBuyPools[].maxPerSkill", desc: "Deckel pro Einzel-Skill innerhalb dieses Pools." },
      { name: "requiresGmApproval", desc: "Zeigt im Charakterbogen einen Warnhinweis an." },
    ],
  },
  {
    title: "Testgegner",
    example: `{
  "id": "raider_ohne_hose",
  "name": "Raider ohne Hose",
  "hp": 40,
  "damageResistance": 0,
  "skillValue": 4,
  "weaponId": "pistole_10mm",
  "notes": "10mm Pistole oder Messer"
}`,
    fields: [
      { name: "skillValue", desc: "Fertigkeitswert für Angriffswürfe des Gegners (reine Referenz, kein automatischer Wurf für NSCs)." },
      { name: "weaponId", desc: "Optional: Referenz auf eine Waffen-ID aus der Item-Liste." },
    ],
  },
  {
    title: "Levelaufstieg",
    intro: "Definiert pro Level, was der Spieler im Levelaufstiegs-Assistenten (Charakterbogen -> 'Level Up') verteilen darf. Ohne Eintrag für ein Level greift ein einfacher Fallback über formulas.skillPointsPerLevel.",
    example: `{
  "level": 4,
  "specialPoints": 1,
  "skillPoints": 5,
  "tagSkillSlots": 0,
  "perkSlots": 1,
  "note": "SPECIAL-Erhöhung alle 4 Level"
}`,
    fields: [
      { name: "specialPoints", desc: "Wie viele Stat-Punkte auf diesem Level frei verteilt werden dürfen." },
      { name: "skillPoints", desc: "Frei verteilbare Skillpunkte auf diesem Level." },
      { name: "tagSkillSlots", desc: "Anzahl zusätzlicher Tag-Skills, die auf diesem Level gewählt werden dürfen." },
      { name: "perkSlots", desc: "Anzahl Perks, die auf diesem Level gewählt werden dürfen (Voraussetzungen werden geprüft)." },
      { name: "note", desc: "Freitext-Hinweis, wird im Levelaufstiegs-Dialog angezeigt." },
    ],
  },
  {
    title: "Trefferzonen",
    intro: "Wird im Würfelterminal als 'Zielzone' bei gezielten Treffern genutzt UND im Charakterbogen als Klick-Tracker für Wundstatus je Zone (gesund/verwundet/verkrüppelt).",
    example: `{
  "id": "kopf",
  "name": "Kopf",
  "penalty": -4
}`,
    fields: [
      { name: "penalty", desc: "Zusatzmalus auf den Zielwert bei einem gezielten Treffer auf diese Zone." },
    ],
  },
  {
    title: "Formeln",
    intro: "Verfügbare Variablen: Alle Stats aus dem UI-Template + level + karma. Verfügbare Funktion: specialBonus(x) (Fallout: 1-4→0, 5-7→1, 8-9→2, 10→3).",
    example: `"maxHp": "(STR+END)*5"
"maxApr": "1 + specialBonus(AGI)"
"bonusFormula": "Math.floor((x-10)/2)"`,
    fields: [
      { name: "bonusFormula", desc: "Optional: Formel für den Stat-Bonus/Modifikator. Variable 'x' = Stat-Wert. D&D: Math.floor((x-10)/2). Fallback: specialBonus(x)." },
      { name: "resourceMax", desc: "Optional: Record<string, string> mit Formeln für Resource-Maxima, z.B. { \"hp\": \"(STR+END)*5\", \"mana\": \"INT*3\" }." },
      { name: "Auswertung", desc: "Formeln sind normale JavaScript-Ausdrücke, z.B. auch Math.max(0, STR-5) möglich." },
      { name: "Fehlerverhalten", desc: "Ungültige Formeln liefern 0 und geben eine Warnung in der Browser-Konsole aus (Entwicklertools)." },
    ],
  },
];

export function HelpTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="pip-panel rounded-sm p-4 text-sm">
        <h3 className="pip-label mb-2">Import/Export – wie funktioniert das?</h3>
        <ul className="list-disc space-y-1 pl-5 text-pip-greendim">
          <li>
            <span className="text-pip-green">Kategorie-Import</span> (z.B. "Rassen importieren"): gleicht die
            importierte Liste <span className="text-pip-amber">nach ID ab</span> — vorhandene Einträge mit
            gleicher ID werden aktualisiert, neue IDs werden ergänzt. Nicht enthaltene, bestehende Einträge
            bleiben unangetastet.
          </li>
          <li>
            <span className="text-pip-green">"Als JSON bearbeiten"</span>: hier ersetzt du die komplette Liste
            durch das, was du eintippst — das ist bewusst ein voller Ersatz, kein Merge.
          </li>
          <li>
            <span className="text-pip-green">"Komplettes Regelwerk importieren"</span>: lädt eine ganze
            RuleSet-Datei. Hat sie dieselbe <code>id</code> wie ein bestehendes Regelwerk, wird dieses komplett
            überschrieben. Hat sie eine neue <code>id</code>, entsteht ein zusätzliches Regelwerk daneben
            (nichts geht verloren, du kannst zwischen mehreren Regelwerken wechseln).
          </li>
          <li>Alle Exporte laden dir eine reine JSON-Datei herunter, unabhängig vom Import-Verhalten.</li>
          <li>
            <span className="text-pip-green">Validierung:</span> Import und manuelle JSON-Bearbeitung prüfen
            Pflichtfelder (z.B. bekannter Item-Typ). Ungültige Einträge werden mit
            genauer Fehlermeldung abgelehnt, gültige Einträge trotzdem übernommen.
          </li>
          <li>
            <span className="text-pip-green">Rückgängig:</span> Jede Kategorie merkt sich die letzten 5 Zustände
            (Button "↺ Rückgängig" erscheint, sobald etwas zum Zurücknehmen da ist).
          </li>
        </ul>
      </div>

      {DOCS.map((doc) => (
        <div key={doc.title} className="pip-panel rounded-sm p-4">
          <h3 className="pip-label mb-2">{doc.title}</h3>
          {doc.intro && <p className="mb-2 text-sm text-pip-greendim">{doc.intro}</p>}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <pre className="overflow-x-auto rounded-sm border border-pip-line bg-black/30 p-2 text-xs">
              {doc.example}
            </pre>
            <ul className="flex flex-col gap-1 text-xs">
              {doc.fields.map((f) => (
                <li key={f.name}>
                  <span className="text-pip-amber">{f.name}</span>
                  <span className="text-pip-greendim"> — {f.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
