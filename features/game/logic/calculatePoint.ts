import { PokerHand } from "../types/hand";
import { MULTIPLIERS } from "../constants/multipliers";

export const calculatePoint = (
  hand: PokerHand,
  rate: number
) => {
  return MULTIPLIERS[hand] * rate;
};