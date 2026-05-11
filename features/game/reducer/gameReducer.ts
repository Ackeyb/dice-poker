import { GameState } from "../types/game";
import { GameAction } from "../types/reducer";

export const gameReducer = (
  state: GameState,
  action: GameAction
): GameState => {
  switch (action.type) {
    case "ROLL_DICE": {

      const canRoll =
        state.phase === "ROUND1_ROLL" ||
        state.phase === "ROUND2_ROLL" ||
        state.phase === "ROUND3_ROLL" ||
        state.phase === "ROUND3_HOLD";

      if (!canRoll) {
        return state;
      }

      const players = [...state.players];

      const currentPlayer =
        players[state.currentPlayerIndex];

      const nextDice =
        currentPlayer.dice.map(
          (die, index) => {

            if (die.held) {
              return die;
            }

            return {
              ...die,

              value:
                action.payload.values[index] ??
                die.value,
            };
          }
        );
        
      players[state.currentPlayerIndex] = {
        ...currentPlayer,
        dice: nextDice,
      };

      return {
        ...state,
        players,
      };
    }
    
    case "TOGGLE_HOLD": {

      const canHold =
        state.phase === "ROUND1_HOLD" ||
        state.phase === "ROUND3_HOLD";

      if (!canHold) {
        return state;
      }

      const players = [...state.players];

      const currentPlayer =
        players[state.currentPlayerIndex];

      const nextDice = currentPlayer.dice.map(
        (die, index) => {
          if (index !== action.payload.dieIndex) {
            return die;
          }

          return {
            ...die,
            held: !die.held,
          };
        }
      );

      players[state.currentPlayerIndex] = {
        ...currentPlayer,
        dice: nextDice,
      };

      return {
        ...state,
        players,
      };
    }

    case "NEXT_PLAYER": {
      return {
        ...state,
        currentPlayerIndex:
          state.currentPlayerIndex + 1,
      };
    }

    case "ADVANCE_PHASE": {
      const isLastPlayer =
        state.currentPlayerIndex ===
        state.players.length - 1;

      switch (state.phase) {

        case "ROUND1_HOLD": {
          // 次Playerへ
          if (!isLastPlayer) {
            return {
              ...state,
              currentPlayerIndex:
                state.currentPlayerIndex + 1,
              phase: "ROUND1_ROLL",
            };
          }

          // Round2開始
          return {
            ...state,
            currentPlayerIndex: 0,
            phase: "ROUND2_ROLL",
          };
        }

        case "ROUND2_ROLL": {
          // 次Playerへ
          if (!isLastPlayer) {
            return {
              ...state,
              currentPlayerIndex:
                state.currentPlayerIndex + 1,
              phase: "ROUND2_ROLL",
            };
          }

          // Round3開始
          return {
            ...state,
            currentPlayerIndex: 0,
            phase: "ROUND3_CONFIRM",
          };
        }

        case "ROUND3_CONFIRM": {

          if (!isLastPlayer) {
            return {
              ...state,
              currentPlayerIndex:
                state.currentPlayerIndex + 1,
              phase: "ROUND3_CONFIRM",
            };
          }

          return {
            ...state,
            currentPlayerIndex: 0,
            phase: "RESULT",
          };
        }

        case "ROUND3_HOLD": {

          if (!isLastPlayer) {
            return {
              ...state,
              currentPlayerIndex:
                state.currentPlayerIndex + 1,
              phase: "ROUND3_CONFIRM",
            };
          }

          return {
            ...state,
            currentPlayerIndex: 0,
            phase: "RESULT",
          };
        }

        case "ROUND3_ROLL": {

          if (!isLastPlayer) {
            return {
              ...state,
              currentPlayerIndex:
                state.currentPlayerIndex + 1,
              phase: "ROUND3_CONFIRM",
            };
          }

          return {
            ...state,
            currentPlayerIndex: 0,
            phase: "RESULT",
          };
        }

        default:
          return state;
      }
    }
    
    case "SET_PHASE": {
      return {
        ...state,
        phase: action.payload.phase,
      };
    }

    case "SET_ANIMATION_STATE": {
      return {
        ...state,
        animationState: action.payload.state,
      };
    }

    default:
      return state;
  }
};

