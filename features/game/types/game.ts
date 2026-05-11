import { DieState } from "./dice";
import { GamePhase } from "./phase";
import { HandRank } from "./hand";

export type PlayerState = {
  name: string;
  dice: DieState[];
  hand: HandRank | null;
  point: number;
};

export type AnimationState =
  | "IDLE"
  | "ROLLING"
  | "WAITING_NEXT";

export type GameState = {
  phase: GamePhase;

  currentPlayerIndex: number;

  players: PlayerState[];

  animationState: AnimationState;
};
