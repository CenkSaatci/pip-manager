import { DifficultyLevel } from "../types/rules";

export interface PoolRollResult {
  poolSize: number;
  target: number;
  rolls: number[];
  successes: number;
  naturalOnes: number;
  difficulty?: DifficultyLevel;
  passed: boolean;
}

function d10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Würfelpool-Wurf laut Regelwerk Abschnitt 1/11/12:
 * - Würfelpool = Skillwert + Luck-Bonus-Würfel
 * - Zielwert = Skillwert, ggf. reduziert durch Schwierigkeit/Deckung/Wunden
 * - Jeder Würfel <= Zielwert ist ein Erfolg, eine natürliche 1 ist immer ein Erfolg
 */
export function rollDicePool(
  poolSize: number,
  skillValue: number,
  difficulty?: DifficultyLevel,
  extraPenalty = 0
): PoolRollResult {
  const target = Math.max(0, skillValue + (difficulty?.penalty ?? 0) + extraPenalty);
  const size = Math.max(1, Math.round(poolSize));
  const rolls = Array.from({ length: size }, () => d10());
  const successes = rolls.filter((r) => r <= target || r === 1).length;
  const needed = difficulty?.successesRequired ?? 1;
  return {
    poolSize: size,
    target,
    rolls,
    successes,
    naturalOnes: rolls.filter((r) => r === 1).length,
    difficulty,
    passed: successes >= needed,
  };
}

/** Initiative/Sequence laut Abschnitt 5: Perception + 1W10 */
export function rollInitiative(perception: number): { total: number; roll: number } {
  const roll = d10();
  return { total: perception + roll, roll };
}

/** Rüstungswurf laut Abschnitt 13: 1W10 gegen DR. Treffer <= DR blockt den kompletten Schaden. */
export function rollArmorCheck(damageResistance: number): { roll: number; blocked: boolean } {
  const roll = d10();
  return { roll, blocked: roll <= damageResistance };
}
