import { useState } from "react";
import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";
import { getSkillEffectiveValue } from "../../lib/derived";
import { roll3d20, ThreeD20RollResult } from "../../lib/dice";

export function DiceRoller3D20({
  char, rules,
}: {
  char: Character; rules: RuleSet; onCharChange?: (c: Character) => void;
}) {
  const [selectedSkill, setSelectedSkill] = useState(rules.skills[0]?.id ?? "");
  const [modifier, setModifier] = useState(0);
  const [lastResult, setLastResult] = useState<ThreeD20RollResult | null>(null);

  const skill = rules.skills.find((s) => s.id === selectedSkill);

  const doRoll = () => {
    if (!skill) return;
    const skillVal = getSkillEffectiveValue(skill, char, rules);
    const target = Math.max(1, Math.min(20, skillVal + modifier));
    const result = roll3d20(target);
    setLastResult(result);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)} className="pip-input rounded-sm px-2 py-1">
          {rules.skills.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
        <div className="flex items-center gap-1 rounded-sm border border-pip-line px-2 py-1 text-xs">
          <span className="text-pip-greendim">Mod:</span>
          <input type="number" value={modifier} onChange={(e) => setModifier(Number(e.target.value))} className="pip-input w-14 rounded-sm px-1 py-0.5 text-center" />
        </div>
        <button onClick={doRoll} className="pip-btn">3W20 würfeln</button>
      </div>

      {skill && (
        <p className="mb-2 text-xs text-pip-greendim">
          Talent: {skill.name} ({getSkillEffectiveValue(skill, char, rules)}) · Modifikator: {modifier > 0 ? "+" : ""}{modifier}
        </p>
      )}

      {lastResult && (
        <div className="mb-4 rounded-sm border border-pip-line p-2 text-sm">
          <p>
            3W20: <span className="text-pip-amber">{lastResult.rolls.join(" · ")}</span>
            {lastResult.successes < 3 && lastResult.rolls.some((r) => r <= lastResult.target) ? (
              <span className="ml-2 text-pip-amber">({lastResult.successes}/3 erfolgreich)</span>
            ) : ""}
          </p>
          <p>Zielwert: {lastResult.target} · {lastResult.successes} von 3 Würfeln erfolgreich</p>
          <p className={lastResult.passed ? "text-pip-green text-glow" : "text-pip-red"}>
            {lastResult.passed ? "Talentprobe BESTANDEN" : "Talentprobe FEHLGESCHLAGEN"}
          </p>
        </div>
      )}
    </div>
  );
}
