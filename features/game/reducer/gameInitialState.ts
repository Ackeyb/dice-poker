import { GameState } from "../types/game";

const createDice = () => {
  return Array.from({ length: 5 }, (_, index) => ({
    id: index,
    value: 1,
    held: false,
  }));
};

export const createGameInitialState = (
  playerNames = ["Player 1", "Player 2"]
): GameState => ({
  phase: "ROUND1_ROLL",

  currentPlayerIndex: 0,

  animationState: "IDLE",

  players: playerNames.map(name => ({
      name,
      dice: createDice(),
      hand: null,
      point: 0,
    })),
});

export const gameInitialState =
  createGameInitialState();
