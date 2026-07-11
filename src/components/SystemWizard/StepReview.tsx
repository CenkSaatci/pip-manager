import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { RuleSet, DiceType } from "../../types/rules";
import * as api from "../../lib/api";
import { BasicsDraft } from "./StepBasics";
import { StatsDraft } from "./StepStats";
import { MechanicsDraft } from "./StepMechanics";
import { PanelsDraft } from "./StepPanels";

interface Props {
  basics: BasicsDraft;
  stats: StatsDraft;
  mechanics: MechanicsDraft;
  panels: PanelsDraft;
  onBack: () => void;
}

function buildRuleSet(b: BasicsDraft, s: StatsDraft, m: MechanicsDraft, p: PanelsDraft): RuleSet {
  const statDefs = s.stats.map((st) => ({
    key: st.key, label: st.label, shortLabel: st.key.toLowerCase(),
    defaultValue: st.defaultValue, min: st.min, max: st.max, extremeThreshold: st.extremeThreshold,
  }));

  const resources = [];
  if (m.hpEnabled) resources.push({ key: "hp", label: "Trefferpunkte", formula: "maxHp", color: "red" as const });
  if (m.karmaEnabled) resources.push({ key: "karma", label: "Karma", color: "blue" as const });
  if (resources.length === 0) resources.push({ key: "hp", label: "Trefferpunkte", formula: "maxHp", color: "red" });

  return {
    id: crypto.randomUUID(),
    name: b.name,
    version: b.version,
    diceSystem: b.diceType === "d10-pool" ? "W10-Pool, roll-under" : b.diceType === "d20-plus" ? "W20 + Mod gegen SG" : "3W20-Probe",
    specialRange: [1, 10],
    skillRange: [0, 10],
    karmaRange: [-10, 10],
    disabledMechanics: [],
    characterCreation: {
      specialStart: s.stats[0]?.defaultValue ?? 5,
      freeSpecialPoints: s.freeSpecialPoints,
      specialMin: Math.min(...s.stats.map((st) => st.min)),
      specialMax: Math.max(...s.stats.map((st) => st.max)),
      extremeValueThreshold: 2,
      freeSkillPoints: m.freeSkillPoints,
      tagSkillCount: p.tagSkillCount,
      tagSkillBonus: p.tagSkillBonus,
      skillCapAtCreation: m.skillCapAtCreation,
    },
    levelProgression: [{ level: 2, skillPoints: 5 }],
    hitLocations: m.calledShots
      ? [
          { id: "torso", name: "Torso", penalty: 0 },
          { id: "kopf", name: "Kopf", penalty: -4 },
          { id: "arm_links", name: "Linker Arm", penalty: -2 },
          { id: "arm_rechts", name: "Rechter Arm", penalty: -2 },
          { id: "bein_links", name: "Linkes Bein", penalty: -2 },
          { id: "bein_rechts", name: "Rechtes Bein", penalty: -2 },
        ]
      : [],
    formulas: {
      maxHp: m.hpFormula || "(STR+END)*5",
      maxApr: "1",
      carryWeight: `${s.stats[0]?.key ?? "STR"}*15`,
      healingRate: "1",
      luckBonusDice: "0",
      skillPointsPerLevel: "5",
      bonusFormula: s.bonusFormula || undefined,
    },
    difficultyLevels: [
      { name: "Normal", penalty: 0, successesRequired: 1 },
    ],
    skills: [],
    races: [],
    traits: [],
    perks: [],
    backgrounds: [],
    items: [],
    enemies: [],
    ui: {
      statsLabel: s.statsLabel,
      currencyLabel: b.currencyLabel,
      diceType: b.diceType as DiceType,
      theme: b.theme,
      stats: statDefs,
      resources,
      panels: {
        skills: { enabled: p.panelSkills, label: "Fertigkeiten" },
        perks: { enabled: p.panelPerks, label: "Perks" },
        traits: { enabled: p.panelTraits, label: "Traits" },
        inventory: { enabled: p.panelInventory, label: "Inventar" },
        dice: { enabled: p.panelDice, label: "Würfelterminal" },
        hitLocations: { enabled: p.panelHitLocations, label: "Trefferzonen" },
        needs: { enabled: p.panelNeeds, label: "Bedürfnisse" },
      },
      wizardSteps: {
        race: p.wizardRace,
        background: p.wizardBackground,
        traits: p.wizardTraits,
      },
    },
  };
}

export function StepReview({ basics, stats, mechanics, panels, onBack }: Props) {
  const { upsertRuleSet, activateRuleSet } = useAppStore();
  const [importing, setImporting] = useState(false);

  const ruleSet = buildRuleSet(basics, stats, mechanics, panels);
  const json = JSON.stringify(ruleSet, null, 2);

  const handleExport = () => api.exportJsonFile(ruleSet, `${basics.name.replace(/\s+/g, "_")}.json`);

  const handleImport = async () => {
    setImporting(true);
    await upsertRuleSet(ruleSet);
    await activateRuleSet(ruleSet.id);
    setImporting(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-2xl text-glow">Überprüfen & Exportieren</h2>

      <div className="rounded-sm border border-pip-line p-3 text-sm">
        <p><span className="text-pip-amber">System:</span> {basics.name}</p>
        <p><span className="text-pip-amber">Attribute:</span> {stats.stats.map((s) => s.key).join(" · ")}</p>
        <p><span className="text-pip-amber">Würfel:</span> {basics.diceType} · <span className="text-pip-amber">Währung:</span> {basics.currencyLabel}</p>
        <p><span className="text-pip-amber">Panels:</span> {[panels.panelSkills && "Skills", panels.panelPerks && "Perks", panels.panelTraits && "Traits", panels.panelInventory && "Inventar", panels.panelDice && "Würfel", panels.panelHitLocations && "Trefferzonen", panels.panelNeeds && "Bedürfnisse"].filter(Boolean).join(", ")}</p>
      </div>

      <pre className="max-h-60 overflow-y-auto rounded-sm border border-pip-line bg-black/30 p-3 font-mono text-xs">{json}</pre>

      <div className="flex justify-between border-t border-pip-line pt-4">
        <button onClick={onBack} className="pip-btn-ghost px-3 py-1">← Zurück</button>
        <div className="flex gap-2">
          <button onClick={handleExport} className="pip-btn-ghost px-3 py-1">Als JSON exportieren</button>
          <button onClick={handleImport} disabled={importing}
            className="rounded-sm border border-pip-green bg-pip-green/10 px-6 py-2 font-display text-sm text-pip-green hover:bg-pip-green/20">
            {importing ? "Wird importiert…" : "Direkt importieren"}
          </button>
        </div>
      </div>
    </div>
  );
}
