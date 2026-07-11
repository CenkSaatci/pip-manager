import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";
import {
  getEffectiveSpecial,
  getMaxHp,
  getMaxApr,
  getCarryWeight,
  getSkillEffectiveValue,
} from "../../lib/derived";
import { specialBonus } from "../../lib/formula";
import { getTags, getResource, getCaps } from "../../lib/compat";
import { getUiTemplate } from "../../types/rules";

export function PrintSheet({ char, rules }: { char: Character; rules: RuleSet }) {
  const race = rules.races.find((r) => r.id === char.raceId);
  const background = rules.backgrounds.find((b) => b.id === char.backgroundId);
  const effective = getEffectiveSpecial(char, rules);
  const equipped = char.inventory.filter((i) => i.equipped);
  const carried = char.inventory.filter((i) => !i.equipped);

  return (
    <div className="print-only p-8 text-black">
      <div className="mb-4 flex items-baseline justify-between border-b-2 border-black pb-2">
        <h1 className="text-3xl font-bold">{char.name}</h1>
        <span>
          Level {char.level} · {race?.name ?? "—"} · {background?.name ?? "—"}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-7 gap-2 text-center text-sm">
        {Object.entries(effective).map(([key, value]) => (
          <div key={key} className="border border-black p-1">
            <div className="font-bold">{key}</div>
            <div className="text-xl">{value}</div>
            <div className="text-xs">Bonus +{specialBonus(value)}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2 text-center text-sm">
        <Stat label="HP" value={`${getResource(char, "hp")} / ${getMaxHp(char, rules)}`} />
        <Stat label="APR" value={`${getResource(char, "apr")} / ${getMaxApr(char, rules)}`} />
        <Stat label="Traglast" value={`${getCarryWeight(char, rules)} kg`} />
        <Stat label={getUiTemplate(rules).currencyLabel ?? "Caps"} value={getCaps(char)} />
      </div>

      <div className="mb-4">
        <h2 className="mb-1 border-b border-black text-lg font-bold">Fertigkeiten</h2>
        <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-sm">
          {rules.skills.map((skill) => (
            <div key={skill.id} className="flex justify-between border-b border-dotted border-black/30">
              <span>
                {skill.name} {getTags(char).includes(skill.id) ? "★" : ""}
              </span>
              <span className="font-bold">{getSkillEffectiveValue(skill, char, rules)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <h2 className="mb-1 border-b border-black text-lg font-bold">Perks &amp; Traits</h2>
          <ul className="text-sm">
            {char.perks.map((p) => {
              const perk = rules.perks.find((x) => x.id === p.perkId);
              return (
                <li key={p.perkId}>
                  {perk?.name ?? p.perkId} {perk && perk.maxRanks > 1 ? `(Rang ${p.rank})` : ""}
                </li>
              );
            })}
            {char.traitIds.map((tid) => {
              const trait = rules.traits.find((t) => t.id === tid);
              return <li key={tid}>{trait?.name ?? tid}</li>;
            })}
            {char.perks.length === 0 && char.traitIds.length === 0 && <li>—</li>}
          </ul>
        </div>
        <div>
          <h2 className="mb-1 border-b border-black text-lg font-bold">Ausrüstung (angelegt)</h2>
          <ul className="text-sm">
            {equipped.map((entry) => {
              const item = rules.items.find((i) => i.id === entry.itemId);
              return (
                <li key={entry.itemId}>
                  {item?.name ?? entry.itemId} × {entry.quantity}
                </li>
              );
            })}
            {equipped.length === 0 && <li>—</li>}
          </ul>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="mb-1 border-b border-black text-lg font-bold">Restliches Inventar</h2>
        <p className="text-sm">
          {carried
            .map((entry) => {
              const item = rules.items.find((i) => i.id === entry.itemId);
              return `${item?.name ?? entry.itemId} ×${entry.quantity}`;
            })
            .join(" · ") || "—"}
        </p>
      </div>

      {char.backstory && (
        <div>
          <h2 className="mb-1 border-b border-black text-lg font-bold">Hintergrund</h2>
          <p className="text-sm whitespace-pre-wrap">{char.backstory}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-black p-1">
      <div className="text-xs font-bold uppercase">{label}</div>
      <div className="text-xl">{value}</div>
    </div>
  );
}
