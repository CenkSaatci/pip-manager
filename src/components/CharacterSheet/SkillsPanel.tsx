import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";
import {
  getSkillBaseValue,
  getSkillEffectiveValue,
  getFixedBackgroundBonus,
  getBackgroundBonus,
  isTagSkill,
} from "../../lib/derived";

export function SkillsPanel({
  char,
  rules,
  onChange,
}: {
  char: Character;
  rules: RuleSet;
  onChange: (c: Character) => void;
}) {
  const spentFree = Object.values(char.skills).reduce((a, b) => a + b, 0);
  const freeBudget = rules.characterCreation.freeSkillPoints;
  const cap = rules.characterCreation.skillCapAtCreation;

  const setSkill = (skillId: string, val: number) => {
    onChange({ ...char, skills: { ...char.skills, [skillId]: Math.max(0, val) } });
  };

  if (rules.skills.length === 0) {
    return (
      <div className="pip-panel rounded-sm p-4 text-pip-greendim">
        Noch keine Skills im aktiven Regelwerk definiert. Lege sie unter "Regelwerk" an oder importiere sie
        per JSON.
      </div>
    );
  }

  return (
    <div className="pip-panel rounded-sm p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="pip-label">Fertigkeiten</h3>
        <span className="text-xs text-pip-amber">
          Frei investiert: {spentFree} / {freeBudget} · Startmaximum {cap} (danach nur mit SL-Genehmigung)
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rules.skills.map((skill) => {
          const base = getSkillBaseValue(skill, char, rules);
          const fixedBg = getFixedBackgroundBonus(skill.id, char, rules);
          const pointBuyBg = getBackgroundBonus(skill.id, char);
          const tag = isTagSkill(skill.id, char);
          const effective = getSkillEffectiveValue(skill, char, rules);
          const overCap = effective > cap && char.level <= 1;
          return (
            <div
              key={skill.id}
              className={`flex items-center justify-between gap-2 border-b py-1 ${
                tag ? "border-pip-amber" : "border-pip-line"
              }`}
            >
              <div>
                <div className="text-sm">
                  {skill.name} {tag && <span className="text-pip-amber">★ Tag-Skill</span>}
                </div>
                <div className="text-xs text-pip-greendim">
                  Basis {base}
                  {fixedBg ? ` +${fixedBg} Hintergrund` : ""}
                  {pointBuyBg ? ` +${pointBuyBg} Punktekauf` : ""}
                  {tag ? ` +${rules.characterCreation.tagSkillBonus} Tag` : ""} ({skill.governingStat}
                  {skill.alternateStats?.length ? `/${skill.alternateStats.join("/")}` : ""})
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={char.skills[skill.id] ?? 0}
                  onChange={(e) => setSkill(skill.id, Number(e.target.value))}
                  className="pip-input w-14 rounded-sm px-1 py-0.5 text-center"
                />
                <span className={`w-10 text-right font-display text-xl text-glow ${overCap ? "text-pip-red" : ""}`}>
                  {effective}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
