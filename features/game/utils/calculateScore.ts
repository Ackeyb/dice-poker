import { MULTIPLIERS } from "../constants/multipliers";
import { HandRank } from "../types/hand";

const BASE_SCORE = 100;

export const calculateScore = (
  hand: HandRank,
  onePairRate = BASE_SCORE
) => {
  return onePairRate * MULTIPLIERS[hand];
};
