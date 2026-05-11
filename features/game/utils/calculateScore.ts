import { MULTIPLIERS } from "../constants/multipliers";
import { HandRank } from "../types/hand";

const BASE_SCORE = 100;
const TWO_PAIR_MULTIPLIER = 2;

export const calculateScore = (
  hand: HandRank,
  twoPairRate = BASE_SCORE * TWO_PAIR_MULTIPLIER
) => {
  const baseScore =
    twoPairRate / TWO_PAIR_MULTIPLIER;

  return baseScore * MULTIPLIERS[hand];
};
