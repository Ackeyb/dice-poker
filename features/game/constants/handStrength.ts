import { HandRank } from "../types/hand";

export const HAND_STRENGTH:
  Record<HandRank, number> = {

  PINSORO: 8,
  FIVE_DICE: 7,
  FOUR_DICE: 6,
  STRAIGHT: 5,
  FULL_HOUSE: 4,
  THREE_DICE: 3,
  TWO_PAIR: 2,
  ONE_PAIR: 1,
  BUTA: 0,
};