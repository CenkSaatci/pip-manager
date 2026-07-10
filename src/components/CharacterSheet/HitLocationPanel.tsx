import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";

type ZoneState = "gesund" | "verwundet" | "verkrueppelt";

function getZoneState(zoneId: string, char: Character): ZoneState {
  if (char.crippledLimbs.includes(zoneId)) return "verkrueppelt";
  if (char.injuredLimbs.includes(zoneId)) return "verwundet";
  return "gesund";
}

const STATE_STYLES: Record<ZoneState, string> = {
  gesund: "border-pip-line text-pip-greendim",
  verwundet: "border-pip-amber text-pip-amber bg-pip-amber/10",
  verkrueppelt: "border-pip-red text-pip-red bg-pip-red/10",
};

export function HitLocationPanel({
  char,
  rules,
  onChange,
}: {
  char: Character;
  rules: RuleSet;
  onChange: (c: Character) => void;
}) {
  const cycle = (zoneId: string) => {
    const state = getZoneState(zoneId, char);
    const injured = char.injuredLimbs.filter((z) => z !== zoneId);
    const crippled = char.crippledLimbs.filter((z) => z !== zoneId);
    if (state === "gesund") {
      onChange({ ...char, injuredLimbs: [...injured, zoneId], crippledLimbs: crippled });
    } else if (state === "verwundet") {
      onChange({ ...char, injuredLimbs: injured, crippledLimbs: [...crippled, zoneId] });
    } else {
      onChange({ ...char, injuredLimbs: injured, crippledLimbs: crippled });
    }
  };

  if (rules.hitLocations.length === 0) {
    return null;
  }

  return (
    <div className="pip-panel rounded-sm p-4">
      <h3 className="pip-label mb-3">Trefferzonen (klicken zum Durchschalten: gesund → verwundet → verkrüppelt)</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {rules.hitLocations.map((zone) => {
          const state = getZoneState(zone.id, char);
          return (
            <button
              key={zone.id}
              onClick={() => cycle(zone.id)}
              className={`rounded-sm border p-2 text-center text-xs transition-colors ${STATE_STYLES[state]}`}
            >
              <div className="font-display text-lg">{zone.name}</div>
              <div className="capitalize">{state}</div>
              <div className="text-[10px] opacity-70">Zielmalus {zone.penalty}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
