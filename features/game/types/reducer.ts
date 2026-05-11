import { GamePhase } from "./phase";

export type GameAction =
    {
      type: "ROLL_DICE";
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
        state: "IDLE" | "ROLLING";
      };
    }

  | {
      type: "ADVANCE_PHASE";
    };