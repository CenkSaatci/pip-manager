import { useMemo, useState } from "react";
import { Character, LevelUpRecord } from "../../types/character";
import { RuleSet, getUiTemplate } from "../../types/rules";
import { getMaxHp, getMaxApr, getLevelReward, checkPerkRequirements } from "../../lib/derived";
import { getStats, getTags, getResource } from "../../lib/compat";
import { useT } from "../../i18n/context";

export function LevelUpModal({
  char,
  rules,
  onClose,
  onChange,
}: {
  char: Character;
  rules: RuleSet;
  onClose: () => void;
  onChange: (c: Character) => void;
}) {
  const { t } = useT();
  const nextLevel = char.level + 1;
  const reward = getLevelReward(nextLevel, rules);
  const specialStats = getStats(char);

  const [specialAlloc, setSpecialAlloc] = useState<Record<string, number>>({});
  const [skillAlloc, setSkillAlloc] = useState<Record<string, number>>({});
  const [newTagSkills, setNewTagSkills] = useState<string[]>([]);
  const [chosenPerks, setChosenPerks] = useState<string[]>([]);

  const specialSpent = Object.values(specialAlloc).reduce((a, b) => a + (b ?? 0), 0);
  const skillSpent = Object.values(skillAlloc).reduce((a, b) => a + (b ?? 0), 0);

  // Vorschau-Charakter mit den bisher getroffenen Zuteilungen dieses Levelaufstiegs,
  // damit Perk-Voraussetzungen (z.B. neue SPECIAL-Werte) korrekt geprüft werden.
  const previewChar: Character = useMemo(() => {
    const special = { ...getStats(char) };
    for (const [k, v] of Object.entries(specialAlloc)) {
      special[k] = (special[k] ?? 0) + (v ?? 0);
    }
    const skills = { ...char.skills };
    for (const [k, v] of Object.entries(skillAlloc)) {
      skills[k] = (skills[k] ?? 0) + (v ?? 0);
    }
    return { ...char, level: nextLevel, stats: special, skills, tagSkillIds: [...getTags(char), ...newTagSkills] };
  }, [char, specialAlloc, skillAlloc, newTagSkills, nextLevel]);

  const gainedHp = getMaxHp(previewChar, rules) - getMaxHp(char, rules);

  const adjustSpecial = (key: string, delta: number) => {
    const current = specialAlloc[key] ?? 0;
    const nextVal = current + delta;
    if (nextVal < 0) return;
    if (delta > 0 && specialSpent >= (reward.specialPoints ?? 0)) return;
    const statDef = getUiTemplate(rules).stats.find((s) => s.key === key);
    const max = statDef?.max ?? rules.specialRange?.[1] ?? 10;
    if ((specialStats[key] ?? 0) + nextVal > max) return;
    setSpecialAlloc({ ...specialAlloc, [key]: nextVal });
  };

  const adjustSkill = (skillId: string, delta: number) => {
    const current = skillAlloc[skillId] ?? 0;
    const nextVal = current + delta;
    if (nextVal < 0) return;
    if (delta > 0 && skillSpent >= reward.skillPoints) return;
    setSkillAlloc({ ...skillAlloc, [skillId]: nextVal });
  };

  const toggleTagSkill = (skillId: string) => {
    if (getTags(char).includes(skillId)) return;
    const has = newTagSkills.includes(skillId);
    if (has) {
      setNewTagSkills(newTagSkills.filter((id) => id !== skillId));
    } else if (newTagSkills.length < (reward.tagSkillSlots ?? 0)) {
      setNewTagSkills([...newTagSkills, skillId]);
    }
  };

  const togglePerk = (perkId: string) => {
    const has = chosenPerks.includes(perkId);
    if (has) {
      setChosenPerks(chosenPerks.filter((id) => id !== perkId));
    } else if (chosenPerks.length < (reward.perkSlots ?? 0)) {
      setChosenPerks([...chosenPerks, perkId]);
    }
  };

  const confirm = () => {
    const nextSpecial = { ...getStats(char) };
    for (const [k, v] of Object.entries(specialAlloc)) {
      nextSpecial[k] = (nextSpecial[k] ?? 0) + (v ?? 0);
    }
    const nextSkills = { ...char.skills };
    for (const [k, v] of Object.entries(skillAlloc)) {
      nextSkills[k] = (nextSkills[k] ?? 0) + (v ?? 0);
    }
    const nextPerks = [...char.perks];
    for (const perkId of chosenPerks) {
      const existing = nextPerks.find((p) => p.perkId === perkId);
      if (existing) existing.rank += 1;
      else nextPerks.push({ perkId, rank: 1 });
    }

    const record: LevelUpRecord = {
      level: nextLevel,
      specialAllocations: specialAlloc,
      skillAllocations: skillAlloc,
      tagSkillsAdded: newTagSkills,
      perksChosen: chosenPerks,
      hpGained: gainedHp,
      timestamp: new Date().toISOString(),
    };

    onChange({
      ...char,
      level: nextLevel,
      stats: nextSpecial,
      skills: nextSkills,
      tagSkillIds: [...getTags(char), ...newTagSkills],
      perks: nextPerks,
      resources: {
        ...char.resources,
        hp: getResource(char, "hp") + gainedHp,
        apr: getMaxApr({ ...char, level: nextLevel }, rules),
      },
      levelHistory: [...char.levelHistory, record],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="pip-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm bg-pip-bg p-5">
        <h2 className="mb-1 font-display text-3xl text-glow">{t('levelUp.title', { level: nextLevel })}</h2>
        {reward.note && <p className="mb-3 text-xs text-pip-amber">{reward.note}</p>}
        <p className="mb-4 text-sm text-pip-greendim">
          {t('levelUp.hpGain', { hp: gainedHp, max: getMaxHp(previewChar, rules) })}
        </p>

        {reward.specialPoints > 0 && (
          <section className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="pip-label">{t('levelUp.statsLabel', { label: getUiTemplate(rules).statsLabel })}</h3>
              <span className="text-xs text-pip-amber">
                {t('levelUp.statsSpent', { spent: specialSpent, points: reward.specialPoints })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
              {getUiTemplate(rules).stats.map((stat) => (
                <div key={stat.key} className="flex flex-col items-center gap-1 rounded-sm border border-pip-line p-2">
                  <span className="text-xs text-pip-greendim">{stat.label}</span>
                  <span className="font-display text-xl text-glow">
                    {specialStats[stat.key] ?? 0}
                    {specialAlloc[stat.key] ? ` +${specialAlloc[stat.key]}` : ""}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => adjustSpecial(stat.key, -1)} className="pip-btn-ghost px-2 text-xs">
                      −
                    </button>
                    <button onClick={() => adjustSpecial(stat.key, 1)} className="pip-btn-ghost px-2 text-xs">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {reward.skillPoints > 0 && (
          <section className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="pip-label">{t('levelUp.skillsLabel')}</h3>
              <span className="text-xs text-pip-amber">
                {t('levelUp.skillsSpent', { spent: skillSpent, points: reward.skillPoints })}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {rules.skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between gap-1 rounded-sm border border-pip-line px-2 py-1 text-sm">
                  <span>{skill.name}</span>
                  <div className="flex items-center gap-2">
                    {skillAlloc[skill.id] ? <span className="text-pip-amber">+{skillAlloc[skill.id]}</span> : null}
                    <button onClick={() => adjustSkill(skill.id, -1)} className="pip-btn-ghost px-2 text-xs">
                      −
                    </button>
                    <button onClick={() => adjustSkill(skill.id, 1)} className="pip-btn-ghost px-2 text-xs">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {reward.tagSkillSlots > 0 && (
          <section className="mb-4">
            <h3 className="pip-label mb-1">
              {t('levelUp.tagSkills', { count: newTagSkills.length, max: reward.tagSkillSlots })}
            </h3>
            <div className="flex flex-wrap gap-1">
              {rules.skills
                .filter((s) => !getTags(char).includes(s.id))
                .map((skill) => {
                  const active = newTagSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => toggleTagSkill(skill.id)}
                      className={`rounded-sm border px-2 py-0.5 text-xs ${
                        active ? "border-pip-amber bg-pip-amber/10 text-pip-amber" : "border-pip-line text-pip-greendim"
                      }`}
                    >
                      {skill.name}
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {reward.perkSlots > 0 && (
          <section className="mb-4">
            <h3 className="pip-label mb-1">
              {t('levelUp.perks', { count: chosenPerks.length, max: reward.perkSlots })}
            </h3>
            <div className="flex flex-col gap-1">
              {rules.perks.map((perk) => {
                const { met, reasons } = checkPerkRequirements(perk, previewChar);
                const active = chosenPerks.includes(perk.id);
                const alreadyMaxed =
                  (char.perks.find((p) => p.perkId === perk.id)?.rank ?? 0) >= perk.maxRanks && !active;
                return (
                  <div key={perk.id} className={`rounded-sm border p-2 text-xs ${active ? "border-pip-amber bg-pip-amber/10" : "border-pip-line"}`}>
                    <div className="flex items-center justify-between">
                      <span>{perk.name}</span>
                      <button
                        disabled={(!met && !active) || alreadyMaxed}
                        onClick={() => togglePerk(perk.id)}
                        className="pip-btn-ghost px-2 py-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {active ? "Entfernen" : "Wählen"}
                      </button>
                    </div>
                    {!met && !active && <p className="mt-1 text-pip-red">{t('levelUp.reqsMissing', { reasons: reasons.join(", ") })}</p>}
                    {alreadyMaxed && <p className="mt-1 text-pip-red">{t('levelUp.maxed')}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {reward.specialPoints === 0 && reward.skillPoints === 0 && reward.tagSkillSlots === 0 && reward.perkSlots === 0 && (
          <p className="mb-4 text-sm text-pip-greendim">
            {t('levelUp.empty')}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-pip-line pt-3">
          <button onClick={onClose} className="pip-btn-ghost">
            {t('levelUp.cancel')}
          </button>
          <button onClick={confirm} className="pip-btn">
            {t('levelUp.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
