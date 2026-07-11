import { Character } from "../../types/character";
import { RuleSet, SPECIAL_KEYS, getUiTemplate } from "../../types/rules";
import { getEffectiveSpecial, getMaxApr, getMaxHp, getCarryWeight, getHealingRate, isExtremeSpecialValue } from "../../lib/derived";
import { specialBonus } from "../../lib/formula";
import { getStats } from "../../lib/compat";

export function SpecialPanel({
  char,
  rules,
  onChange,
}: {
  char: Character;
  rules: RuleSet;
  onChange: (c: Character) => void;
}) {
  const effective = getEffectiveSpecial(char, rules);
  const ui = getUiTemplate(rules);
  const stats = getStats(char);

  const resourceValue = (res: typeof ui.resources[number]): string | number => {
    if (res.key === "hp") return getMaxHp(char, rules);
    if (res.key === "apr") return getMaxApr(char, rules);
    if (res.formula === "maxHp") return getMaxHp(char, rules);
    if (res.formula === "maxApr") return getMaxApr(char, rules);
    if (res.formula === "carryWeight") return getCarryWeight(char, rules);
    if (res.formula === "healingRate") return getHealingRate(char, rules);
    return char.resources?.[res.key] ?? 0;
  };

  const resourceSuffix = (key: string): string => {
    if (key === "carryWeight" || key === "Traglast") return " kg";
    return "";
  };

  const isSpecialKey = (key: string): boolean => SPECIAL_KEYS.includes(key as any);

  return (
    <div className="pip-panel rounded-sm p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="pip-label">{ui.statsLabel}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ui.stats.map((stat) => {
          const val = stats[stat.key] ?? stat.defaultValue ?? 5;
          const effectiveVal = effective[stat.key] ?? val;
          const raceMod = effectiveVal - val;
          const extremeThreshold = stat.extremeThreshold ?? 2;
          const extreme = val <= extremeThreshold;
          const st = stat;
          return (
            <div key={st.key} className="flex flex-col items-center gap-1">
              <label className="text-xs text-pip-greendim">{st.label}</label>
              <input
                type="number"
                min={st.min ?? 1}
                max={st.max ?? 10}
                value={val}
                onChange={(e) =>
                  onChange({
                    ...char,
                    stats: { ...stats, [st.key]: Number(e.target.value) },
                  })
                }
                className={`pip-input w-16 rounded-sm px-2 py-1 text-center font-display text-2xl ${
                  extreme ? "border-pip-amber" : ""
                }`}
              />
              <span className="text-xs text-pip-amber">
                {effectiveVal}
                {raceMod !== 0 ? ` (${raceMod > 0 ? "+" : ""}${raceMod} Mod.)` : ""}
              </span>
              {isSpecialKey(st.key) && (
                <span className="text-xs text-pip-greendim">Bonus +{specialBonus(effectiveVal)}</span>
              )}
              {extreme && <span className="text-xs text-pip-amber">SL-Genehmigung nötig</span>}
            </div>
          );
        })}
      </div>

      {ui.resources.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-pip-line pt-3 sm:grid-cols-4">
          {ui.resources.map((res) => (
            <Derived key={res.key} label={res.label} value={`${resourceValue(res)}${resourceSuffix(res.key)}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function Derived({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="pip-label">{label}</span>
      <span className="font-display text-2xl text-glow">{value}</span>
    </div>
  );
}
