import { DieState } from "./dice";

export type GamePlayer = {
  name: string;

  dice: DieState[];
};