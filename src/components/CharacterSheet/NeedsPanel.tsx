import { Character } from "../../types/character";
import { useT } from "../../i18n/context";

export function NeedsPanel({ char, onChange }: { char: Character; onChange: (c: Character) => void }) {
  const { t } = useT();
  const adjust = (field: "hunger" | "thirst", delta: number) => {
    const current = (char as any)[field] ?? 0;
    onChange({ ...char, [field]: Math.max(0, current + delta) });
  };

  const newDay = () => {
    onChange({ ...char, hunger: (char.hunger ?? 0) + 1, thirst: (char.thirst ?? 0) + 1 });
  };

  return (
    <div className="pip-panel rounded-sm p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="pip-label">{t('needs.title')}</h3>
        <button onClick={newDay} className="pip-btn-ghost px-2 py-1 text-xs">
          {t('needs.newDay')}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NeedRow label={t('needs.hunger')} value={char.hunger ?? 0} onAdjust={(d) => adjust("hunger", d)} />
        <NeedRow label={t('needs.thirst')} value={char.thirst ?? 0} onAdjust={(d) => adjust("thirst", d)} />
      </div>
      <p className="mt-2 text-xs text-pip-greendim">
        {t('needs.hint')}
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
