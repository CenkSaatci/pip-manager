import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";
import { getTags, setTags } from "../../lib/compat";

export function BackgroundPanel({
  char,
  rules,
  onChange,
}: {
  char: Character;
  rules: RuleSet;
  onChange: (c: Character) => void;
}) {
  const background = rules.backgrounds.find((b) => b.id === char.backgroundId);

  const setAllocation = (poolName: string, skillId: string, value: number, maxPerSkill: number) => {
    const clamped = Math.max(0, Math.min(maxPerSkill, value));
    onChange({
      ...char,
      backgroundAllocations: {
        ...char.backgroundAllocations,
        [poolName]: { ...(char.backgroundAllocations[poolName] ?? {}), [skillId]: clamped },
      },
    });
  };

  const toggleTagSkill = (skillId: string) => {
    const tags = getTags(char);
    const has = tags.includes(skillId);
    if (has) {
      onChange(setTags(char, tags.filter((id) => id !== skillId)));
    } else if (tags.length < rules.characterCreation.tagSkillCount) {
      onChange(setTags(char, [...tags, skillId]));
    }
  };

  return (
    <div className="pip-panel rounded-sm p-4">
      <h3 className="pip-label mb-3">Hintergrund &amp; Tag-Skills</h3>

      {background?.requiresGmApproval && (
        <p className="mb-2 rounded-sm border border-pip-amber bg-pip-amber/10 p-2 text-xs text-pip-amber">
          Dieser Hintergrund benötigt Meistergenehmigung.
        </p>
      )}

      {background?.fixedSkillBonuses && Object.keys(background.fixedSkillBonuses).length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-pip-greendim">Feste Grundausbildung:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(background.fixedSkillBonuses).map(([skillId, amount]) => {
              const skill = rules.skills.find((s) => s.id === skillId);
              return (
                <span key={skillId} className="rounded-sm border border-pip-line px-2 py-0.5 text-xs">
                  {skill?.name ?? skillId} +{amount}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {background?.pointBuyPools?.map((pool) => {
        const allocations = char.backgroundAllocations[pool.poolName] ?? {};
        const spent = Object.values(allocations).reduce((a, b) => a + b, 0);
        return (
          <div key={pool.poolName} className="mb-3 rounded-sm border border-pip-line p-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-pip-greendim">
                {pool.poolName} — max. +{pool.maxPerSkill} pro Skill
              </span>
              <span className="text-pip-amber">
                {spent} / {pool.points} Punkte
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {pool.eligibleSkillIds.map((skillId) => {
                const skill = rules.skills.find((s) => s.id === skillId);
                return (
                  <div key={skillId} className="flex items-center justify-between gap-1 text-xs">
                    <span>{skill?.name ?? skillId}</span>
                    <input
                      type="number"
                      min={0}
                      max={pool.maxPerSkill}
                      value={allocations[skillId] ?? 0}
                      onChange={(e) => setAllocation(pool.poolName, skillId, Number(e.target.value), pool.maxPerSkill)}
                      className="pip-input w-12 rounded-sm px-1 py-0.5 text-center"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-2">
        <span className="text-xs text-pip-greendim">
          Tag-Skills wählen ({getTags(char).length} / {rules.characterCreation.tagSkillCount}, je +
          {rules.characterCreation.tagSkillBonus}):
        </span>
        <div className="mt-1 flex flex-wrap gap-1">
          {rules.skills.map((skill) => {
            const tags = getTags(char);
            const active = tags.includes(skill.id);
            const disabled = !active && tags.length >= rules.characterCreation.tagSkillCount;
            return (
              <button
                key={skill.id}
                disabled={disabled}
                onClick={() => toggleTagSkill(skill.id)}
                className={`rounded-sm border px-2 py-0.5 text-xs transition-colors ${
                  active
                    ? "border-pip-amber bg-pip-amber/10 text-pip-amber"
                    : "border-pip-line text-pip-greendim hover:text-pip-green disabled:opacity-40"
                }`}
              >
                {skill.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
