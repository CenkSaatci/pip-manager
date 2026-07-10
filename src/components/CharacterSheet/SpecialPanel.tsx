import { Character } from "../../types/character";
import { RuleSet, SPECIAL_KEYS, SPECIAL_LABELS } from "../../types/rules";
import { getEffectiveSpecial, getMaxApr, getMaxHp, getCarryWeight, getHealingRate, isExtremeSpecialValue } from "../../lib/derived";
import { specialBonus } from "../../lib/formula";

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
  const [min, max] = rules.specialRange;
  const invested = SPECIAL_KEYS.reduce((sum, k) => sum + char.special[k], 0);
  const budget = rules.characterCreation.specialStart * 7 + rules.characterCreation.freeSpecialPoints;

  return (
    <div className="pip-panel rounded-sm p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="pip-label">S.P.E.C.I.A.L.</h3>
        <span className="text-xs text-pip-amber">
          Punkte verteilt: {invested} / {budget}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SPECIAL_KEYS.map((key) => {
          const raceMod = effective[key] - char.special[key];
          const extreme = isExtremeSpecialValue(char.special[key], rules);
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <label className="text-xs text-pip-greendim">{SPECIAL_LABELS[key]}</label>
              <input
                type="number"
                min={min}
                max={max}
                value={char.special[key]}
                onChange={(e) =>
                  onChange({
                    ...char,
                    special: { ...char.special, [key]: Number(e.target.value) },
                  })
                }
                className={`pip-input w-16 rounded-sm px-2 py-1 text-center font-display text-2xl ${
                  extreme ? "border-pip-amber" : ""
                }`}
              />
              <span className="text-xs text-pip-amber">
                {effective[key]}
                {raceMod !== 0 ? ` (${raceMod > 0 ? "+" : ""}${raceMod} Rasse/Traits)` : ""}
              </span>
              <span className="text-xs text-pip-greendim">Bonus +{specialBonus(effective[key])}</span>
              {extreme && <span className="text-xs text-pip-amber">SL-Genehmigung nötig</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-pip-line pt-3 sm:grid-cols-4">
        <Derived label="Max. HP" value={getMaxHp(char, rules)} />
        <Derived label="APR" value={getMaxApr(char, rules)} />
        <Derived label="Traglast" value={`${getCarryWeight(char, rules)} kg`} />
        <Derived label="Heilrate" value={getHealingRate(char, rules)} />
      </div>
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
