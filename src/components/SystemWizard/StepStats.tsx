import { StatConfig } from "../../types/rules";

export interface StatEntry {
  key: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  extremeThreshold: number;
}

export interface StatsDraft {
  statsLabel: string;
  stats: StatEntry[];
  bonusFormula: string;
  freeSpecialPoints: number;
}

interface Props {
  value: StatsDraft;
  onChange: (v: StatsDraft) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRESETS: Record<string, { label: string; entries: StatEntry[] }> = {
  fallout: {
    label: "Fallout laden",
    entries: [
      { key: "STR", label: "Stärke", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
      { key: "PER", label: "Wahrnehmung", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
      { key: "END", label: "Ausdauer", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
      { key: "CHA", label: "Charisma", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
      { key: "INT", label: "Intelligenz", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
      { key: "AGI", label: "Geschicklichkeit", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
      { key: "LUK", label: "Glück", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
    ],
  },
  dnd: {
    label: "D&D laden",
    entries: [
      { key: "STR", label: "Stärke", defaultValue: 10, min: 3, max: 20, extremeThreshold: 3 },
      { key: "DEX", label: "Geschicklichkeit", defaultValue: 10, min: 3, max: 20, extremeThreshold: 3 },
      { key: "CON", label: "Konstitution", defaultValue: 10, min: 3, max: 20, extremeThreshold: 3 },
      { key: "INT", label: "Intelligenz", defaultValue: 10, min: 3, max: 20, extremeThreshold: 3 },
      { key: "WIS", label: "Weisheit", defaultValue: 10, min: 3, max: 20, extremeThreshold: 3 },
      { key: "CHA", label: "Charisma", defaultValue: 10, min: 3, max: 20, extremeThreshold: 3 },
    ],
  },
  dsa: {
    label: "DSA laden",
    entries: [
      { key: "MU", label: "Mut", defaultValue: 8, min: 1, max: 21, extremeThreshold: 2 },
      { key: "KL", label: "Klugheit", defaultValue: 8, min: 1, max: 21, extremeThreshold: 2 },
      { key: "IN", label: "Intuition", defaultValue: 8, min: 1, max: 21, extremeThreshold: 2 },
      { key: "CH", label: "Charisma", defaultValue: 8, min: 1, max: 21, extremeThreshold: 2 },
      { key: "FF", label: "Fingerfertigkeit", defaultValue: 8, min: 1, max: 21, extremeThreshold: 2 },
      { key: "GE", label: "Gewandtheit", defaultValue: 8, min: 1, max: 21, extremeThreshold: 2 },
      { key: "KO", label: "Konstitution", defaultValue: 8, min: 1, max: 21, extremeThreshold: 2 },
      { key: "KK", label: "Körperkraft", defaultValue: 8, min: 1, max: 21, extremeThreshold: 2 },
    ],
  },
};

export function StepStats({ value, onChange, onNext, onBack }: Props) {
  const count = value.stats.length;

  const setCount = (n: number) => {
    const clamped = Math.max(3, Math.min(12, n));
    if (clamped === count) return;
    if (clamped > count) {
      const next = [...value.stats];
      for (let i = count; i < clamped; i++) {
        next.push({ key: `STAT${i + 1}`, label: `Stat ${i + 1}`, defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 });
      }
      onChange({ ...value, stats: next });
    } else {
      onChange({ ...value, stats: value.stats.slice(0, clamped) });
    }
  };

  const updateStat = (idx: number, patch: Partial<StatEntry>) => {
    const next = [...value.stats];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...value, stats: next });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-2xl text-glow">Attribute definieren</h2>

      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([id, preset]) => (
          <button key={id} onClick={() => onChange({ ...value, stats: preset.entries })}
            className="pip-btn-ghost px-3 py-1 text-xs">{preset.label}</button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="pip-label text-sm">Anzahl Attribute: {count}</span>
        <input type="range" min={3} max={12} value={count} onChange={(e) => setCount(Number(e.target.value))}
          className="flex-1 accent-pip-green" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pip-line text-left text-xs text-pip-greendim">
              <th className="p-1">Kürzel</th>
              <th className="p-1">Name</th>
              <th className="p-1 w-16">Min</th>
              <th className="p-1 w-16">Max</th>
              <th className="p-1 w-16">Start</th>
              <th className="p-1 w-16">Extrem</th>
            </tr>
          </thead>
          <tbody>
            {value.stats.map((s, i) => (
              <tr key={i} className="border-b border-pip-line">
                <td className="p-1"><input value={s.key} onChange={(e) => updateStat(i, { key: e.target.value.toUpperCase().slice(0, 6) })}
                  className="pip-input w-full rounded-sm px-1 py-0.5 text-center font-bold" /></td>
                <td className="p-1"><input value={s.label} onChange={(e) => updateStat(i, { label: e.target.value })}
                  className="pip-input w-full rounded-sm px-1 py-0.5" /></td>
                <td className="p-1"><input type="number" value={s.min} onChange={(e) => updateStat(i, { min: Number(e.target.value) })}
                  className="pip-input w-full rounded-sm px-1 py-0.5 text-center" /></td>
                <td className="p-1"><input type="number" value={s.max} onChange={(e) => updateStat(i, { max: Number(e.target.value) })}
                  className="pip-input w-full rounded-sm px-1 py-0.5 text-center" /></td>
                <td className="p-1"><input type="number" value={s.defaultValue} onChange={(e) => updateStat(i, { defaultValue: Number(e.target.value) })}
                  className="pip-input w-full rounded-sm px-1 py-0.5 text-center" /></td>
                <td className="p-1"><input type="number" value={s.extremeThreshold} onChange={(e) => updateStat(i, { extremeThreshold: Number(e.target.value) })}
                  className="pip-input w-full rounded-sm px-1 py-0.5 text-center" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="pip-label">Bonus/Modifikator-Formel</span>
          <select value={value.bonusFormula} onChange={(e) => onChange({ ...value, bonusFormula: e.target.value })}
            className="pip-input rounded-sm px-2 py-2 font-mono text-sm">
            <option value="specialBonus(x)">specialBonus(x) — Fallout (1-4→0, 5-7→1, …)</option>
            <option value="Math.floor((x-10)/2)">Math.floor((x-10)/2) — D&D</option>
            <option value="Math.floor(x/3)">Math.floor(x/3) — Shadowrun</option>
            <option value="">Kein Bonus/Modifikator</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="pip-label">Frei verteilbare Punkte</span>
          <input type="number" min={0} value={value.freeSpecialPoints}
            onChange={(e) => onChange({ ...value, freeSpecialPoints: Number(e.target.value) })}
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
