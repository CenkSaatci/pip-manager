import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { RuleSet, emptyRuleSet, getUiTemplate } from "../../types/rules";
import { EntityListEditor } from "./EntityListEditor";
import { JsonImportExport } from "./JsonImportExport";
import { HelpTab } from "./HelpTab";
import * as api from "../../lib/api";
import {
  validateRace,
  validateSkill,
  validatePerk,
  validateTrait,
  validateItem,
  validateBackground,
  validateEnemy,
  validateLevelReward,
} from "../../lib/validators";

const uid = () => crypto.randomUUID();

type Tab = "meta" | "races" | "skills" | "perks" | "traits" | "items" | "backgrounds" | "enemies" | "levels" | "hitlocations" | "ui" | "help";

export function RulesManager() {
  const { ruleSets, activeRuleSet, upsertRuleSet, activateRuleSet, removeRuleSet } = useAppStore();
  const [tab, setTab] = useState<Tab>("meta");

  const rules = activeRuleSet;
  const update = (patch: Partial<RuleSet>) => upsertRuleSet({ ...rules, ...patch });

  const handleNewRuleSet = () => {
    const r = emptyRuleSet(`Neues Regelwerk ${ruleSets.length + 1}`);
    upsertRuleSet(r);
    activateRuleSet(r.id);
  };

  const handleImportFullRuleSet = async () => {
    const imported = await api.importJsonFile<RuleSet>();
    if (!imported) return;
    imported.id = imported.id ?? uid();
    await upsertRuleSet(imported);
    await activateRuleSet(imported.id);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "meta", label: "Übersicht & Formeln" },
    { id: "races", label: "Rassen" },
    { id: "skills", label: "Fertigkeiten" },
    { id: "perks", label: "Perks" },
    { id: "traits", label: "Traits" },
    { id: "items", label: "Items" },
    { id: "backgrounds", label: "Hintergründe" },
    { id: "enemies", label: "Testgegner" },
    { id: "levels", label: "Levelaufstieg" },
    { id: "hitlocations", label: "Trefferzonen" },
    { id: "ui", label: "UI-Template" },
    { id: "help", label: "❓ Hilfe" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="pip-panel flex flex-wrap items-center justify-between gap-3 rounded-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pip-label">Aktives Regelwerk:</span>
          <select
            value={rules.id}
            onChange={(e) => activateRuleSet(e.target.value)}
            className="pip-input rounded-sm px-2 py-1"
          >
            {ruleSets.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (v{r.version})
              </option>
            ))}
          </select>
          <button onClick={handleNewRuleSet} className="pip-btn-ghost px-2 py-1 text-xs">
            + Neues Regelwerk
          </button>
          {ruleSets.length > 1 && (
            <button
              onClick={() => confirm("Regelwerk wirklich löschen?") && removeRuleSet(rules.id)}
              className="text-xs text-pip-red hover:text-glow"
            >
              Löschen
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleImportFullRuleSet} className="pip-btn-ghost">
            Komplettes Regelwerk importieren
          </button>
          <button
            onClick={() => api.exportJsonFile(rules, `${rules.name.replace(/\s+/g, "_")}.json`)}
            className="pip-btn"
          >
            Komplettes Regelwerk exportieren
          </button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border px-3 py-1 text-sm transition-colors ${
              tab === t.id
                ? "border-pip-green bg-pip-green/10 text-pip-green"
                : "border-pip-line text-pip-greendim hover:text-pip-green"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "meta" && <MetaTab rules={rules} onChange={update} />}

      {tab === "races" && (
        <EntityListEditor
          label="Rassen"
          items={rules.races}
          idKey="id"
          renderTitle={(r) => r.name}
          renderSubtitle={(r) => Object.entries(r.statModifiers).map(([k, v]) => `${k} ${v! > 0 ? "+" : ""}${v}`).join(", ")}
          newItem={() => ({ id: uid(), name: "Neue Rasse", statModifiers: {} })}
          onChange={(races) => update({ races })}
          validateItem={validateRace}
        />
      )}

      {tab === "skills" && (
        <EntityListEditor
          label="Fertigkeiten"
          items={rules.skills}
          idKey="id"
          renderTitle={(s) => s.name}
          renderSubtitle={(s) => `${s.governingStat} · Formel: ${s.baseFormula}`}
          newItem={() => ({ id: uid(), name: "Neue Fertigkeit", governingStat: "INT" as const, baseFormula: "specialBonus(INT)" })}
          onChange={(skills) => update({ skills })}
          validateItem={validateSkill}
        />
      )}

      {tab === "perks" && (
        <EntityListEditor
          label="Perks"
          items={rules.perks}
          idKey="id"
          renderTitle={(p) => p.name}
          renderSubtitle={(p) => `max. Rang ${p.maxRanks}`}
          newItem={() => ({ id: uid(), name: "Neuer Perk", maxRanks: 1, requirements: {} })}
          onChange={(perks) => update({ perks })}
          validateItem={validatePerk}
        />
      )}

      {tab === "traits" && (
        <EntityListEditor
          label="Traits"
          items={rules.traits}
          idKey="id"
          renderTitle={(t) => t.name}
          renderSubtitle={() => "Vor- und Nachteil kombiniert"}
          newItem={() => ({ id: uid(), name: "Neuer Trait", benefits: [], drawbacks: [] })}
          onChange={(traits) => update({ traits })}
          validateItem={validateTrait}
        />
      )}

      {tab === "items" && (
        <EntityListEditor
          label="Items"
          items={rules.items}
          idKey="id"
          renderTitle={(i) => i.name}
          renderSubtitle={(i) => `${i.type} · ${i.weight}kg · ${i.value} Caps`}
          newItem={() => ({ id: uid(), name: "Neues Item", type: "misc" as const, weight: 0, value: 0 })}
          onChange={(items) => update({ items })}
          validateItem={validateItem as (i: typeof rules.items[number]) => string[]}
        />
      )}

      {tab === "backgrounds" && (
        <EntityListEditor
          label="Hintergründe"
          items={rules.backgrounds}
          idKey="id"
          renderTitle={(b) => b.name}
          renderSubtitle={(b) => b.description ?? ""}
          newItem={() => ({ id: uid(), name: "Neuer Hintergrund" })}
          onChange={(backgrounds) => update({ backgrounds })}
          validateItem={validateBackground}
        />
      )}

      {tab === "enemies" && (
        <EntityListEditor
          label="Testgegner"
          items={rules.enemies}
          idKey="id"
          renderTitle={(e) => e.name}
          renderSubtitle={(e) => `HP ${e.hp} · DR ${e.damageResistance} · Skill ${e.skillValue}`}
          newItem={() => ({ id: uid(), name: "Neuer Gegner", hp: 40, damageResistance: 0, skillValue: 4 })}
          onChange={(enemies) => update({ enemies })}
          validateItem={validateEnemy}
        />
      )}

      {tab === "levels" && (
        <EntityListEditor
          label="Levelaufstieg"
          items={rules.levelProgression}
          idKey="level"
          renderTitle={(l) => `Level ${l.level}`}
          renderSubtitle={(l) =>
            `SPECIAL +${l.specialPoints ?? 0} · Skillpunkte ${l.skillPoints ?? 0} · Tag-Skills +${l.tagSkillSlots ?? 0} · Perks +${l.perkSlots ?? 0}`
          }
          newItem={() => ({ level: rules.levelProgression.length + 2, skillPoints: 5 })}
          onChange={(levelProgression) => update({ levelProgression })}
          validateItem={validateLevelReward}
        />
      )}

      {tab === "hitlocations" && (
        <EntityListEditor
          label="Trefferzonen"
          items={rules.hitLocations}
          idKey="id"
          renderTitle={(h) => h.name}
          renderSubtitle={(h) => `Zielmalus ${h.penalty}`}
          newItem={() => ({ id: uid(), name: "Neue Zone", penalty: 0 })}
          onChange={(hitLocations) => update({ hitLocations })}
        />
      )}

      {tab === "ui" && <UiTab rules={rules} onChange={update} />}

      {tab === "help" && <HelpTab />}
    </div>
  );
}

function MetaTab({ rules, onChange }: { rules: RuleSet; onChange: (patch: Partial<RuleSet>) => void }) {
  const allMechanics: RuleSet["disabledMechanics"] = [
    "karma",
    "equipmentCondition",
    "vats",
    "cyborg",
    "synths",
    "criticalMultipliers",
    "sustainedFire",
  ];
  const mechanicLabels: Record<string, string> = {
    karma: "Karma",
    equipmentCondition: "Ausrüstungszustand",
    vats: "VATS",
    cyborg: "Cyborg",
    synths: "Synths",
    criticalMultipliers: "Kritische Schadensmultiplikatoren",
    sustainedFire: "Dauerfeuer",
  };

  const toggleMechanic = (m: (typeof allMechanics)[number]) => {
    const has = rules.disabledMechanics.includes(m);
    onChange({
      disabledMechanics: has ? rules.disabledMechanics.filter((x) => x !== m) : [...rules.disabledMechanics, m],
    });
  };

  const cc = rules.characterCreation;
  const setCc = (patch: Partial<RuleSet["characterCreation"]>) => onChange({ characterCreation: { ...cc, ...patch } });

  return (
    <div className="flex flex-col gap-4">
      <div className="pip-panel grid grid-cols-1 gap-3 rounded-sm p-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            value={rules.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="pip-input w-full rounded-sm px-2 py-1"
          />
        </Field>
        <Field label="Version">
          <input
            value={rules.version}
            onChange={(e) => onChange({ version: e.target.value })}
            className="pip-input w-full rounded-sm px-2 py-1"
          />
        </Field>
        <Field label="Würfelsystem (Beschreibung)">
          <input
            value={rules.diceSystem}
            onChange={(e) => onChange({ diceSystem: e.target.value })}
            className="pip-input w-full rounded-sm px-2 py-1"
          />
        </Field>
      </div>

      <div className="pip-panel rounded-sm p-4">
        <h3 className="pip-label mb-2">Charaktererstellung (Abschnitt 2, 6, 7)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumField label="SPECIAL-Start" value={cc.specialStart} onChange={(v) => setCc({ specialStart: v })} />
          <NumField label="Freie SPECIAL-Punkte" value={cc.freeSpecialPoints} onChange={(v) => setCc({ freeSpecialPoints: v })} />
          <NumField label="SPECIAL Min" value={cc.specialMin} onChange={(v) => setCc({ specialMin: v })} />
          <NumField label="SPECIAL Max" value={cc.specialMax} onChange={(v) => setCc({ specialMax: v })} />
          <NumField
            label="Extremwert-Schwelle (SL-OK)"
            value={cc.extremeValueThreshold}
            onChange={(v) => setCc({ extremeValueThreshold: v })}
          />
          <NumField label="Freie Skillpunkte" value={cc.freeSkillPoints} onChange={(v) => setCc({ freeSkillPoints: v })} />
          <NumField label="Anzahl Tag-Skills" value={cc.tagSkillCount} onChange={(v) => setCc({ tagSkillCount: v })} />
          <NumField label="Tag-Skill-Bonus" value={cc.tagSkillBonus} onChange={(v) => setCc({ tagSkillBonus: v })} />
          <NumField label="Skill-Startmaximum" value={cc.skillCapAtCreation} onChange={(v) => setCc({ skillCapAtCreation: v })} />
        </div>
      </div>

      <div className="pip-panel rounded-sm p-4">
        <h3 className="pip-label mb-2">Abgeschaltete Mechaniken (Abschnitt 24)</h3>
        <div className="flex flex-wrap gap-2">
          {allMechanics.map((m) => {
            const active = rules.disabledMechanics.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMechanic(m)}
                className={`rounded-sm border px-2 py-1 text-xs transition-colors ${
                  active ? "border-pip-red text-pip-red" : "border-pip-line text-pip-greendim hover:text-pip-green"
                }`}
              >
                {mechanicLabels[m]} {active ? "· deaktiviert" : "· aktiv"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pip-panel rounded-sm p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="pip-label">Formeln (Variablen: STR, PER, END, CHA, INT, AGI, LUK, level, karma; Funktion specialBonus(x))</h3>
          <JsonImportExport
            label="Formeln"
            data={rules.formulas}
            onImport={(formulas) => onChange({ formulas: { ...rules.formulas, ...formulas } })}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(Object.keys(rules.formulas) as (keyof RuleSet["formulas"])[]).filter((k) => k !== "resourceMax").map((key) => (
            <Field key={key} label={key}>
              <input
                value={(rules.formulas[key] as string) ?? ""}
                onChange={(e) => onChange({ formulas: { ...rules.formulas, [key]: e.target.value } })}
                className="pip-input w-full rounded-sm px-2 py-1 font-mono text-sm"
              />
            </Field>
          ))}
        </div>
      </div>

      <EntityListEditor
        label="Schwierigkeitsgrade"
        items={rules.difficultyLevels}
        idKey="name"
        renderTitle={(d) => d.name}
        renderSubtitle={(d) => `Malus ${d.penalty} · ${d.successesRequired} Erfolge nötig`}
        newItem={() => ({ name: "Neue Stufe", penalty: 0, successesRequired: 1 })}
        onChange={(difficultyLevels) => onChange({ difficultyLevels })}
      />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="pip-label">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="pip-input w-full rounded-sm px-2 py-1"
      />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="pip-label">{label}</span>
      {children}
    </label>
  );
}

const ALL_PANEL_KEYS = ["skills", "perks", "traits", "inventory", "dice", "hitLocations", "needs"] as const;
const PANEL_LABELS: Record<string, string> = {
  skills: "Fertigkeiten",
  perks: "Perks",
  traits: "Traits",
  inventory: "Inventar",
  dice: "Würfelterminal",
  hitLocations: "Trefferzonen",
  needs: "Bedürfnisse",
};

function UiTab({ rules, onChange }: { rules: RuleSet; onChange: (patch: Partial<RuleSet>) => void }) {
  const template = getUiTemplate(rules);

  const setUi = (patch: any) => {
    const next = { ...template, ...patch };
    onChange({ ui: next });
  };

  const togglePanel = (key: string) => {
    setUi({
      panels: {
        ...template.panels,
        [key]: { ...template.panels[key], enabled: !template.panels[key].enabled },
      },
    });
  };

  const setPanelLabel = (key: string, label: string) => {
    setUi({
      panels: {
        ...template.panels,
        [key]: { ...template.panels[key], label },
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="pip-panel rounded-sm p-4">
        <Field label="Stats-Label (z.B. S.P.E.C.I.A.L., Attribute, Eigenschaften)">
          <input
            value={template.statsLabel}
            onChange={(e) => setUi({ statsLabel: e.target.value })}
            className="pip-input w-full rounded-sm px-2 py-1"
          />
        </Field>
      </div>

      <EntityListEditor
        label="Stats / Attribute"
        items={template.stats}
        idKey="key"
        renderTitle={(s) => `${s.key} — ${s.label}`}
        renderSubtitle={(s) => `Default ${s.defaultValue ?? 5} · Min ${s.min ?? 1} · Max ${s.max ?? 10} · Extrem ${s.extremeThreshold ?? 2}`}
        newItem={() => ({ key: uid().slice(0, 6), label: "Neuer Stat", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 })}
        onChange={(stats) => setUi({ stats })}
      />

      <EntityListEditor
        label="Resources / Balken"
        items={template.resources}
        idKey="key"
        renderTitle={(r) => `${r.key} — ${r.label}`}
        renderSubtitle={(r: any) => `Formel: ${r.formula ?? "—"} · Farbe: ${r.color}`}
        newItem={() => ({ key: uid().slice(0, 6), label: "Neue Resource", color: "amber" })}
        onChange={(resources) => setUi({ resources })}
      />

      <div className="pip-panel rounded-sm p-4">
        <h3 className="pip-label mb-3">Panels (ein/aus)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ALL_PANEL_KEYS.map((key) => {
            const panel = template.panels[key];
            if (!panel) return null;
            return (
              <div key={key} className="flex flex-col gap-2 rounded-sm border border-pip-line p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{PANEL_LABELS[key] ?? key}</span>
                  <button
                    onClick={() => togglePanel(key)}
                    className={`rounded-sm border px-2 py-0.5 text-xs ${
                      panel.enabled
                        ? "border-pip-green text-pip-green"
                        : "border-pip-red/50 text-pip-red"
                    }`}
                  >
                    {panel.enabled ? "AN" : "AUS"}
                  </button>
                </div>
                <input
                  value={panel.label}
                  onChange={(e) => setPanelLabel(key, e.target.value)}
                  className="pip-input w-full rounded-sm px-1 py-0.5 text-xs"
                  placeholder="Label"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
