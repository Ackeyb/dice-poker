import { MULTIPLIERS } from "../constants/multipliers";
import { HandRank } from "../types/hand";

const BASE_SCORE = 100;

export const calculateScore = (
  hand: HandRank,
  baseScore = BASE_SCORE
) => {
  return baseScore * MULTIPLIERS[hand];
};
