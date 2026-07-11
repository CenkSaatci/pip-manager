import { DifficultyLevel } from "../types/rules";

// ─── Hilfs-Würfel ─────────────────────────────────────────────────────

function d10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

function d20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/** W20 n-mal werfen, Ergebnisse absteigend sortiert. */
function d20n(n: number): number[] {
  return Array.from({ length: n }, () => d20()).sort((a, b) => b - a);
}

// ─── Result-Typen ─────────────────────────────────────────────────────

export interface PoolRollResult {
  poolSize: number;
  target: number;
  rolls: number[];
  successes: number;
  naturalOnes: number;
  difficulty?: DifficultyLevel;
  passed: boolean;
}

export interface D20RollResult {
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  passed: boolean;
  advantage: boolean;
  rolls: number[];   // [erster] oder [erster, zweiter]
}

export interface ThreeD20RollResult {
  rolls: [number, number, number];
  target: number;
  successes: number;     // wie viele Würfel ≤ target
  passed: boolean;
}

// ─── Fallout: d10-Pool, roll-under ────────────────────────────────────

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

// ─── D&D 5e: d20 + Mod, roll-high ───────────────────────────────────

/**
 * D&D-Artiger Fertigkeitswurf: d20 + Modifikator gegen SG (DC).
 * Bei Advantage/Disadvantage wird zweimal geworfen.
 */
export function rollD20(modifier: number, dc: number, advantage: boolean = false): D20RollResult {
  const raw = d20n(advantage ? 2 : 1);
  const roll = advantage ? raw[0] : raw[0];
  return {
    roll,
    modifier,
    total: roll + modifier,
    dc,
    passed: (roll + modifier) >= dc,
    advantage,
    rolls: raw,
  };
}

/** D&D-Initiative: d20 + Modifikator (default DEX) */
export function rollD20Initiative(modifier: number): { total: number; roll: number } {
  const roll = d20();
  return { total: roll + modifier, roll };
}

// ─── DSA: 3W20-Probe, roll-under ─────────────────────────────────────

/**
 * DSA-Talentprobe: 3W20, jeder muss ≤ target sein.
 */
export function roll3d20(target: number): ThreeD20RollResult {
  const r1 = d20();
  const r2 = d20();
  const r3 = d20();
  const successes = [r1, r2, r3].filter((r) => r <= target).length;
  return {
    rolls: [r1, r2, r3],
    target,
    successes,
    passed: successes === 3,
  };
}
