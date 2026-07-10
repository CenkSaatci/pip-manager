import { Character } from "../../types/character";

export function NeedsPanel({ char, onChange }: { char: Character; onChange: (c: Character) => void }) {
  const adjust = (field: "hunger" | "thirst", delta: number) => {
    onChange({ ...char, [field]: Math.max(0, char[field] + delta) });
  };

  const newDay = () => {
    onChange({ ...char, hunger: char.hunger + 1, thirst: char.thirst + 1 });
  };

  return (
    <div className="pip-panel rounded-sm p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="pip-label">Bedürfnisse</h3>
        <button onClick={newDay} className="pip-btn-ghost px-2 py-1 text-xs">
          Neuer Tag (+1 / +1)
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NeedRow label="Hunger" value={char.hunger} onAdjust={(d) => adjust("hunger", d)} />
        <NeedRow label="Durst" value={char.thirst} onAdjust={(d) => adjust("thirst", d)} />
      </div>
      <p className="mt-2 text-xs text-pip-greendim">
        Reine Zählwerte ohne automatische Auswirkung — die Schwellen/Konsequenzen legt ihr am Tisch fest.
      </p>
    </div>
  );
}

function NeedRow({ label, value, onAdjust }: { label: string; value: number; onAdjust: (delta: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-pip-line p-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onAdjust(-1)} className="pip-btn-ghost px-2 text-xs">
          −
        </button>
        <span className="w-8 text-center font-display text-xl text-glow">{value}</span>
        <button onClick={() => onAdjust(1)} className="pip-btn-ghost px-2 text-xs">
          +
        </button>
      </div>
    </div>
  );
}
