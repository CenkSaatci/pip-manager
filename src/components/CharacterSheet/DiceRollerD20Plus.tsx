import { useState } from "react";
import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";
import { useT } from "../../i18n/context";
import { getSkillEffectiveValue, getEffectiveSpecial } from "../../lib/derived";
import { getBonusValue } from "../../lib/formula";
import { rollD20, rollD20Initiative, D20RollResult } from "../../lib/dice";

export function DiceRollerD20Plus({
  char, rules,
}: {
  char: Character; rules: RuleSet; onCharChange?: (c: Character) => void;
}) {
  const { t } = useT();
  const [selectedSkill, setSelectedSkill] = useState(rules.skills[0]?.id ?? "");
  const [dc, setDc] = useState(15);
  const [advantage, setAdvantage] = useState<boolean | null>(null);
  const [lastResult, setLastResult] = useState<D20RollResult | null>(null);
  const [initiative, setInitiative] = useState<{ total: number; roll: number } | null>(null);

  const skill = rules.skills.find((s) => s.id === selectedSkill);
  const effectiveSpecial = getEffectiveSpecial(char, rules) ?? {};

  const doRoll = () => {
    if (!skill) return;
    const skillVal = getSkillEffectiveValue(skill, char, rules);
    const mod = getBonusValue(skillVal, rules);
    const result = rollD20(mod, dc, advantage ?? false);
    setLastResult(result);
  };

  const doInitiative = () => {
    const dexMod = getBonusValue(effectiveSpecial.DEX ?? 10, rules);
    setInitiative(rollD20Initiative(dexMod));
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)} className="pip-input rounded-sm px-2 py-1">
          {rules.skills.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
        <div className="flex items-center gap-1 rounded-sm border border-pip-line px-2 py-1 text-xs">
          <span className="text-pip-greendim">{t("dice.dc")}</span>
          <input type="number" min={1} max={40} value={dc} onChange={(e) => setDc(Number(e.target.value))} className="pip-input w-12 rounded-sm px-1 py-0.5 text-center" />
        </div>
        <div className="flex items-center gap-1 rounded-sm border border-pip-line px-2 py-1 text-xs">
          {[null, false, true].map((val) => (
            <button key={String(val)} onClick={() => setAdvantage(val)}
              className={`rounded-sm px-2 py-0.5 ${advantage === val ? "bg-pip-green/20 text-pip-green" : "text-pip-greendim hover:text-pip-green"}`}>
              {val === null ? t("dice.normalLabel") : val ? t("dice.advantageLabel") : t("dice.disadvantageLabel")}
            </button>
          ))}
        </div>
        <button onClick={doRoll} className="pip-btn">{t("dice.rollD20")}</button>
      </div>

      {skill && (() => {
        const skillVal = getSkillEffectiveValue(skill, char, rules);
        const mod = getBonusValue(skillVal, rules);
        return <p className="mb-2 text-xs text-pip-greendim">{t("dice.skillInfo", { name: skill.name, val: skillVal, mod, dc })}</p>;
      })()}

      {lastResult && (
        <div className="mb-4 rounded-sm border border-pip-line p-2 text-sm">
          <p>
            <span className="text-pip-amber">{lastResult.roll}</span>
            {lastResult.rolls.length > 1 ? ` ${t("dice.d20Advantage", { rolls: lastResult.rolls.join(", ") })}` : ""}
            {lastResult.advantage ? ` · ${t("dice.advantageLabel")}` : lastResult.advantage === false ? ` · ${t("dice.disadvantageLabel")}` : ""}
          </p>
          <p>{t("dice.d20Result", { roll: lastResult.roll, mod: lastResult.modifier, total: lastResult.total, dc: lastResult.dc })}</p>
          <p className={lastResult.passed ? "text-pip-green text-glow" : "text-pip-red"}>
            {lastResult.passed ? t("dice.passed") : t("dice.failed")}
            {lastResult.roll === 20 ? ` ${t("dice.d20Nat", { roll: lastResult.roll })}` : lastResult.roll === 1 ? ` ${t("dice.d20NatFail", { roll: lastResult.roll })}` : ""}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-pip-line pt-3">
        <span className="pip-label">{t("dice.initLabel")}</span>
        <button onClick={doInitiative} className="pip-btn-ghost">{t("dice.initDnd")}</button>
        {initiative && (
          <span className="text-glow font-display text-xl">{t("dice.initResultDnd", { total: initiative.total, roll: initiative.roll })}</span>
        )}
      </div>
    </div>
  );
}
