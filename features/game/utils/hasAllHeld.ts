import { DieState } from "../types/dice";

export const hasAllHeld = (
  dice: DieState[]
) => {
  return dice.every(die => die.held);
};