import { useState } from "react";
import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";
import { useT } from "../../i18n/context";
import { getDicePoolSize, getSkillEffectiveValue, getEffectiveSpecial } from "../../lib/derived";
import { rollDicePool, rollInitiative, rollArmorCheck, PoolRollResult } from "../../lib/dice";

export function DiceRollerD10Pool({
  char, rules, onCharChange,
}: {
  char: Character; rules: RuleSet; onCharChange?: (c: Character) => void;
}) {
  const { t } = useT();
  const [selectedSkill, setSelectedSkill] = useState(rules.skills[0]?.id ?? "");
  const [difficultyName, setDifficultyName] = useState(rules.difficultyLevels[2]?.name ?? "");
  const [coverPenalty, setCoverPenalty] = useState(0);
  const [selectedWeapon, setSelectedWeapon] = useState<string>("");
  const [targetZone, setTargetZone] = useState<string>("");
  const [burstFire, setBurstFire] = useState(false);
  const [lastResult, setLastResult] = useState<PoolRollResult | null>(null);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [initiative, setInitiative] = useState<{ total: number; roll: number } | null>(null);
  const [armorDr, setArmorDr] = useState(0);
  const [armorResult, setArmorResult] = useState<{ roll: number; blocked: boolean } | null>(null);

  const skill = rules.skills.find((s) => s.id === selectedSkill);
  const difficulty = rules.difficultyLevels.find((d) => d.name === difficultyName);
  const weapon = rules.items.find((i) => i.id === selectedWeapon);
  const weaponEntry = char.inventory.find((i) => i.itemId === selectedWeapon);
  const weaponsForSkill = rules.items.filter((i) => i.type === "weapon" && (!i.skillId || i.skillId === selectedSkill));
  const zone = rules.hitLocations.find((h) => h.id === targetZone);
  const zonePenalty = zone?.penalty ?? 0;
  const effectiveSpecial = getEffectiveSpecial(char, rules) ?? {};
  const ammoCount = weapon?.isAutomatic ? (weaponEntry?.currentAmmo ?? 0) : 0;
  const canBurst = weapon?.isAutomatic && ammoCount >= (weapon.burstAmmoCost ?? 0);

  const doRoll = () => {
    if (!skill) return;
    const pool = getDicePoolSize(skill, char, rules);
    const target = getSkillEffectiveValue(skill, char, rules);
    const result = rollDicePool(pool, target, difficulty, coverPenalty + zonePenalty);
    setLastResult(result);
    if (weapon?.damage !== undefined) {
      const burstBonus = burstFire && weapon.isAutomatic ? weapon.burstDamageBonus ?? 0 : 0;
      setLastDamage(weapon.damage + result.successes + burstBonus);
    } else {
      setLastDamage(null);
    }
    if (burstFire && weapon?.isAutomatic && weaponEntry && weapon.burstAmmoCost && onCharChange) {
      const cost = weapon.burstAmmoCost;
      onCharChange({
        ...char,
        inventory: char.inventory.map((i) =>
          i.itemId === selectedWeapon ? { ...i, currentAmmo: Math.max(0, (i.currentAmmo ?? 0) - cost) } : i
        ),
      });
    }
  };

  const doInitiative = () => setInitiative(rollInitiative(effectiveSpecial.PER));
  const doArmorCheck = () => setArmorResult(rollArmorCheck(armorDr));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select value={selectedSkill} onChange={(e) => { setSelectedSkill(e.target.value); setSelectedWeapon(""); }} className="pip-input rounded-sm px-2 py-1">
          {rules.skills.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
        <select value={selectedWeapon} onChange={(e) => { setSelectedWeapon(e.target.value); setBurstFire(false); }} className="pip-input rounded-sm px-2 py-1">
          <option value="">{t("dice.noWeapon")}</option>
          {weaponsForSkill.map((w) => (<option key={w.id} value={w.id}>{t("dice.weaponOption", { name: w.name, dmg: w.damage ?? 0 })}</option>))}
        </select>
        {weapon?.isAutomatic && (
          <label className={`flex items-center gap-1 rounded-sm border px-2 py-1 text-xs ${canBurst ? "border-pip-line" : "border-pip-red/50 opacity-60"}`}>
            <input type="checkbox" checked={burstFire} disabled={!canBurst} onChange={(e) => setBurstFire(e.target.checked)} />
            {t("dice.burstLabel", { bonus: weapon.burstDamageBonus ?? 0, cost: weapon.burstAmmoCost ?? 0 })}
            <span className="ml-1 text-pip-amber">{t("dice.burstAmmo", { count: ammoCount })}</span>
          </label>
        )}
        <select value={difficultyName} onChange={(e) => setDifficultyName(e.target.value)} className="pip-input rounded-sm px-2 py-1">
          {rules.difficultyLevels.map((d) => (<option key={d.name} value={d.name}>{t("dice.difficultyOption", { name: d.name, penalty: d.penalty, required: d.successesRequired })}</option>))}
        </select>
        <select value={coverPenalty} onChange={(e) => setCoverPenalty(Number(e.target.value))} className="pip-input rounded-sm px-2 py-1">
          <option value={0}>{t("dice.coverNone")}</option><option value={-1}>{t("dice.coverLight")}</option><option value={-2}>{t("dice.coverGood")}</option>
        </select>
        <select value={targetZone} onChange={(e) => setTargetZone(e.target.value)} className="pip-input rounded-sm px-2 py-1">
          <option value="">{t("dice.zoneNone")}</option>
          {rules.hitLocations.map((h) => (<option key={h.id} value={h.id}>{t("dice.zoneOption", { name: h.name, penalty: h.penalty })}</option>))}
        </select>
        <button onClick={doRoll} className="pip-btn">{t("dice.roll")}</button>
      </div>

      {skill && (
        <p className="mb-2 text-xs text-pip-greendim">
          {t("dice.poolInfo", { pool: getDicePoolSize(skill, char, rules), skill: getSkillEffectiveValue(skill, char, rules) })}
        </p>
      )}

      {lastResult && (
        <div className="mb-4 rounded-sm border border-pip-line p-2 text-sm">
          <p>
            {t("dice.target", { target: lastResult.target })} · {t("dice.rolls", { pool: lastResult.poolSize, rolls: lastResult.rolls.join(", ") })} · {t("dice.successes", { count: lastResult.successes })}
            {lastResult.naturalOnes > 0 ? ` ${t("dice.naturalOnes", { count: lastResult.naturalOnes })}` : ""}
          </p>
          <p className={lastResult.passed ? "text-pip-green text-glow" : "text-pip-red"}>{lastResult.passed ? t("dice.passed") : t("dice.failed")}{zone ? ` · ${t("dice.targetZone", { name: zone.name })}` : ""}</p>
          {lastDamage !== null && (
            <p className="mt-1 text-pip-amber">
              {t("dice.damage", { weapon: weapon?.damage ?? 0, succ: lastResult.successes, total: lastDamage })}
              {burstFire && weapon?.isAutomatic ? " " + t("dice.damageBurst", { bonus: weapon.burstDamageBonus ?? 0 }) : ""}
            </p>
          )}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2 border-t border-pip-line pt-3">
        <span className="pip-label">{t("dice.armorLabel")}</span>
        <span className="text-xs text-pip-greendim">{t("dice.armorDr")}</span>
        <input type="number" min={0} value={armorDr} onChange={(e) => setArmorDr(Number(e.target.value))} className="pip-input w-16 rounded-sm px-2 py-1 text-center" />
        <button onClick={doArmorCheck} className="pip-btn-ghost">{t("dice.armorRoll")}</button>
        {armorResult && (<span className={armorResult.blocked ? "text-pip-green text-glow" : "text-pip-red"}>{t("dice.armorResult", { roll: armorResult.roll, result: armorResult.blocked ? t("dice.armorBlocked") : t("dice.armorFull") })}</span>)}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-pip-line pt-3">
        <span className="pip-label">{t("dice.initLabel")}</span>
        <button onClick={doInitiative} className="pip-btn-ghost">{t("dice.initFallout")}</button>
        {initiative && (<span className="text-glow font-display text-xl">{t("dice.initResult", { total: initiative.total, per: effectiveSpecial.PER ?? 0, roll: initiative.roll })}</span>)}
      </div>
    </div>
  );
}
