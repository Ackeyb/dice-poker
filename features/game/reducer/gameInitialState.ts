import { GameState } from "../types/game";

const createDice = () => {
  return Array.from({ length: 5 }, (_, index) => ({
    id: index,
    value: 1,
    held: false,
  }));
};

export const gameInitialState: GameState = {
  phase: "ROUND1_ROLL",

  currentPlayerIndex: 0,

  animationState: "IDLE",

  players: [
    {
      name: "Player 1",
      dice: createDice(),
      hand: null,
      point: 0,
    },

    {
      name: "Player 2",
      dice: createDice(),
      hand: null,
      point: 0,
    },
  ],
};