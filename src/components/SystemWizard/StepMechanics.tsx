export interface MechanicsDraft {
  hpEnabled: boolean;
  hpFormula: string;
  karmaEnabled: boolean;
  armorRoll: boolean;
  burstFire: boolean;
  coverPenalty: boolean;
  calledShots: boolean;
  freeSkillPoints: number;
  skillCapAtCreation: number;
}

interface Props {
  value: MechanicsDraft;
  onChange: (v: MechanicsDraft) => void;
  onNext: () => void;
  onBack: () => void;
}

const HP_PRESETS: Record<string, string> = {
  "(STR+END)*5": "(STR+END)*5 — Fallout",
  "CON*6+10": "CON*6+10 — D&D",
  "(KO+KK)/2+20": "(KO+KK)/2+20 — DSA",
};

export function StepMechanics({ value, onChange, onNext, onBack }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-2xl text-glow">Mechaniken konfigurieren</h2>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 rounded-sm border border-pip-line p-3 text-sm cursor-pointer hover:border-pip-green">
          <input type="checkbox" checked={value.hpEnabled} onChange={(e) => onChange({ ...value, hpEnabled: e.target.checked })} />
          <span>Trefferpunkte (HP)</span>
        </label>
        {value.hpEnabled && (
          <div className="col-span-2">
            <select value={value.hpFormula} onChange={(e) => onChange({ ...value, hpFormula: e.target.value })}
              className="pip-input w-full rounded-sm px-2 py-2 font-mono text-sm">
              {Object.entries(HP_PRESETS).map(([formula, label]) => (
                <option key={formula} value={formula}>{label}</option>
              ))}
              <option value="">Eigene Formel…</option>
            </select>
            {!Object.keys(HP_PRESETS).includes(value.hpFormula) && (
              <input value={value.hpFormula} onChange={(e) => onChange({ ...value, hpFormula: e.target.value })}
                className="pip-input mt-1 w-full rounded-sm px-2 py-1 font-mono text-sm" placeholder="z.B. (STR+END)*5" />
            )}
          </div>
        )}

        <label className="flex items-center gap-2 rounded-sm border border-pip-line p-3 text-sm cursor-pointer hover:border-pip-green">
          <input type="checkbox" checked={value.karmaEnabled} onChange={(e) => onChange({ ...value, karmaEnabled: e.target.checked })} />
          <span>Karma/Ruf-System</span>
        </label>
        <label className="flex items-center gap-2 rounded-sm border border-pip-line p-3 text-sm cursor-pointer hover:border-pip-green">
          <input type="checkbox" checked={value.armorRoll} onChange={(e) => onChange({ ...value, armorRoll: e.target.checked })} />
          <span>Rüstungswurf</span>
        </label>
        <label className="flex items-center gap-2 rounded-sm border border-pip-line p-3 text-sm cursor-pointer hover:border-pip-green">
          <input type="checkbox" checked={value.burstFire} onChange={(e) => onChange({ ...value, burstFire: e.target.checked })} />
          <span>Automatikfeuer</span>
        </label>
        <label className="flex items-center gap-2 rounded-sm border border-pip-line p-3 text-sm cursor-pointer hover:border-pip-green">
          <input type="checkbox" checked={value.coverPenalty} onChange={(e) => onChange({ ...value, coverPenalty: e.target.checked })} />
          <span>Deckungs-Boni/Mali</span>
        </label>
        <label className="flex items-center gap-2 rounded-sm border border-pip-line p-3 text-sm cursor-pointer hover:border-pip-green">
          <input type="checkbox" checked={value.calledShots} onChange={(e) => onChange({ ...value, calledShots: e.target.checked })} />
          <span>Gezielte Treffer (Trefferzonen)</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-pip-line pt-4">
        <label className="flex flex-col gap-1">
          <span className="pip-label">Freie Skillpunkte bei Erstellung</span>
          <input type="number" min={0} value={value.freeSkillPoints} onChange={(e) => onChange({ ...value, freeSkillPoints: Number(e.target.value) })}
            className="pip-input rounded-sm px-2 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="pip-label">Skill-Startmaximum</span>
          <input type="number" min={0} value={value.skillCapAtCreation} onChange={(e) => onChange({ ...value, skillCapAtCreation: Number(e.target.value) })}
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
