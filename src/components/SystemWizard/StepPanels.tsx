export interface PanelsDraft {
  panelSkills: boolean;
  panelPerks: boolean;
  panelTraits: boolean;
  panelInventory: boolean;
  panelDice: boolean;
  panelHitLocations: boolean;
  panelNeeds: boolean;
  wizardRace: boolean;
  wizardBackground: boolean;
  wizardTraits: boolean;
  tagSkillCount: number;
  tagSkillBonus: number;
}

interface Props {
  value: PanelsDraft;
  onChange: (v: PanelsDraft) => void;
  onNext: () => void;
  onBack: () => void;
}

const PANEL_TOGGLE: { key: keyof PanelsDraft; label: string }[] = [
  { key: "panelSkills", label: "Fertigkeiten" },
  { key: "panelPerks", label: "Perks" },
  { key: "panelTraits", label: "Traits" },
  { key: "panelInventory", label: "Inventar" },
  { key: "panelDice", label: "Würfelterminal" },
  { key: "panelHitLocations", label: "Trefferzonen" },
  { key: "panelNeeds", label: "Bedürfnisse" },
];

const WIZARD_TOGGLE: { key: keyof PanelsDraft; label: string }[] = [
  { key: "wizardRace", label: "Rasse auswählen" },
  { key: "wizardBackground", label: "Hintergrund auswählen" },
  { key: "wizardTraits", label: "Traits auswählen" },
];

export function StepPanels({ value, onChange, onNext, onBack }: Props) {
  const toggle = (key: keyof PanelsDraft) => onChange({ ...value, [key]: !value[key] });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-2xl text-glow">Panels & Wizard konfigurieren</h2>

      <div>
        <h3 className="pip-label mb-2">Panels (angezeigte Bereiche)</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PANEL_TOGGLE.map(({ key, label }) => (
            <label key={key} className={`flex items-center gap-2 rounded-sm border p-2 text-sm cursor-pointer transition-colors ${value[key] ? "border-pip-green bg-pip-green/10" : "border-pip-line"}`}>
              <input type="checkbox" checked={!!value[key]} onChange={() => toggle(key)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-pip-line pt-4">
        <h3 className="pip-label mb-2">Wizard-Schritte (Charaktererstellungs-Assistent)</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WIZARD_TOGGLE.map(({ key, label }) => (
            <label key={key} className={`flex items-center gap-2 rounded-sm border p-2 text-sm cursor-pointer transition-colors ${value[key] ? "border-pip-green bg-pip-green/10" : "border-pip-line"}`}>
              <input type="checkbox" checked={!!value[key]} onChange={() => toggle(key)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-pip-line pt-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="pip-label">Anzahl Boni-Skills</span>
          <input type="number" min={0} value={value.tagSkillCount} onChange={(e) => onChange({ ...value, tagSkillCount: Number(e.target.value) })}
            className="pip-input rounded-sm px-2 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="pip-label">Bonus pro Boni-Skill</span>
          <input type="number" min={0} value={value.tagSkillBonus} onChange={(e) => onChange({ ...value, tagSkillBonus: Number(e.target.value) })}
            className="pip-input rounded-sm px-2 py-2" />
        </label>
      </div>

      <div className="flex justify-between border-t border-pip-line pt-4">
        <button onClick={onBack} className="pip-btn-ghost px-3 py-1">← Zurück</button>
        <button onClick={onNext} className="rounded-sm border border-pip-green bg-pip-green/10 px-6 py-2 font-display text-sm text-pip-green hover:bg-pip-green/20">
          Weiter →
        </button>
      </div>
    </div>
  );
}
