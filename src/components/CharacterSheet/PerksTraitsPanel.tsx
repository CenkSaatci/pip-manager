import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";
import { checkPerkRequirements } from "../../lib/derived";
import { useT } from "../../i18n/context";

export function PerksTraitsPanel({
  char,
  rules,
  onChange,
}: {
  char: Character;
  rules: RuleSet;
  onChange: (c: Character) => void;
}) {
  const { t } = useT();
  const toggleTrait = (traitId: string) => {
    const has = char.traitIds.includes(traitId);
    onChange({
      ...char,
      traitIds: has ? char.traitIds.filter((t) => t !== traitId) : [...char.traitIds, traitId],
    });
  };

  const togglePerk = (perkId: string) => {
    const existing = char.perks.find((p) => p.perkId === perkId);
    if (existing) {
      onChange({ ...char, perks: char.perks.filter((p) => p.perkId !== perkId) });
    } else {
      onChange({ ...char, perks: [...char.perks, { perkId, rank: 1 }] });
    }
  };

  const setPerkRank = (perkId: string, rank: number) => {
    onChange({
      ...char,
      perks: char.perks.map((p) => (p.perkId === perkId ? { ...p, rank } : p)),
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="pip-panel rounded-sm p-4">
        <h3 className="pip-label mb-3">{t('perksTraits.traits')}</h3>
        {rules.traits.length === 0 && <p className="text-sm text-pip-greendim">{t('perksTraits.traitsEmpty')}</p>}
        <div className="flex flex-col gap-2">
          {rules.traits.map((trait) => {
            const active = char.traitIds.includes(trait.id);
            return (
              <label
                key={trait.id}
                className={`cursor-pointer rounded-sm border p-2 text-sm transition-colors ${
                  active ? "border-pip-green bg-pip-green/10" : "border-pip-line"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{trait.name}</span>
                  <input type="checkbox" checked={active} onChange={() => toggleTrait(trait.id)} />
                </div>
                {trait.description && <p className="mt-1 text-xs text-pip-greendim">{trait.description}</p>}
              </label>
            );
          })}
        </div>
      </div>

      <div className="pip-panel rounded-sm p-4">
        <h3 className="pip-label mb-3">{t('perksTraits.perks')}</h3>
        {rules.perks.length === 0 && <p className="text-sm text-pip-greendim">{t('perksTraits.perksEmpty')}</p>}
        <div className="flex flex-col gap-2">
          {rules.perks.map((perk) => {
            const owned = char.perks.find((p) => p.perkId === perk.id);
            const { met, reasons } = checkPerkRequirements(perk, char);
            const canTake = met || !!owned;
            return (
              <div
                key={perk.id}
                className={`rounded-sm border p-2 text-sm ${
                  owned ? "border-pip-green bg-pip-green/10" : canTake ? "border-pip-line" : "border-pip-line opacity-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{perk.name}</span>
                  <button
                    disabled={!canTake}
                    onClick={() => togglePerk(perk.id)}
                    className="pip-btn-ghost px-2 py-0.5 text-xs disabled:cursor-not-allowed"
                  >
                    {owned ? t('perksTraits.remove') : t('perksTraits.select')}
                  </button>
                </div>
                {perk.description && <p className="mt-1 text-xs text-pip-greendim">{perk.description}</p>}
                {!met && !owned && (
                  <p className="mt-1 text-xs text-pip-red">{t('perksTraits.reqsMissing')}: {reasons.join(", ")}</p>
                )}
                {owned && perk.maxRanks > 1 && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span>{t('perksTraits.rank')}:</span>
                    <input
                      type="number"
                      min={1}
                      max={perk.maxRanks}
                      value={owned.rank}
                      onChange={(e) => setPerkRank(perk.id, Number(e.target.value))}
                      className="pip-input w-14 rounded-sm px-1 py-0.5 text-center"
                    />
                    <span>/ {perk.maxRanks}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
