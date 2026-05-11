import { GamePhase } from "./phase";

export type GameAction =
    {
      type: "ROLL_DICE";
      payload: {
        values: number[];
      };
    }

  | {
      type: "TOGGLE_HOLD";
      payload: {
        dieIndex: number;
      };
    }

  | {
      type: "NEXT_PLAYER";
    }

  | {
      type: "SET_PHASE";
      payload: {
        phase: GamePhase;
      };
    }

  | {
      type: "SET_ANIMATION_STATE";
      payload: {
        state: "IDLE" | "ROLLING" | "WAITING_NEXT";
      };
    }

  | {
      type: "ADVANCE_PHASE";
    };
