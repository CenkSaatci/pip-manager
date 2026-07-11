import { useT } from "../../i18n/context";
import { Character } from "../../types/character";
import { RuleSet, getUiTemplate } from "../../types/rules";
import { DiceRollerD10Pool } from "./DiceRollerD10Pool";
import { DiceRollerD20Plus } from "./DiceRollerD20Plus";
import { DiceRoller3D20 } from "./DiceRoller3D20";

export function DiceRollerPanel({
  char,
  rules,
  onCharChange,
}: {
  char: Character;
  rules: RuleSet;
  onCharChange?: (c: Character) => void;
}) {
  const { t } = useT();
  const diceType = getUiTemplate(rules).diceType ?? "d10-pool";

  const title: Record<string, string> = {
    "d10-pool": t("dice.poolFallout"),
    "d20-plus": t("dice.poolDnd"),
    "3d20": t("dice.poolDsa"),
  };

  return (
    <div className="pip-panel rounded-sm p-4">
      <h3 className="pip-label mb-3">{t("dice.title", { desc: title[diceType] ?? diceType })}</h3>

      {diceType === "d10-pool" && <DiceRollerD10Pool char={char} rules={rules} onCharChange={onCharChange} />}
      {diceType === "d20-plus" && <DiceRollerD20Plus char={char} rules={rules} onCharChange={onCharChange} />}
      {diceType === "3d20" && <DiceRoller3D20 char={char} rules={rules} onCharChange={onCharChange} />}
    </div>
  );
}
