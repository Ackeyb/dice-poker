import { create } from "zustand";

type DoubleUpState = {

  winnerIndexes: number[];

  loserIndexes: number[];

  score: number;

  playerNames: string[];

  twoPairRate: number;

  setDoubleUpData: (
    data: {
      winnerIndexes: number[];
      loserIndexes: number[];
      score: number;
      playerNames: string[];
      twoPairRate: number;
    }
  ) => void;
};

export const useDoubleUpStore =
  create<DoubleUpState>((set) => ({

    winnerIndexes: [],

    loserIndexes: [],

    score: 0,

    playerNames: [],

    twoPairRate: 0,

    setDoubleUpData: (data) =>
      set({
        winnerIndexes:
          data.winnerIndexes,

        loserIndexes:
          data.loserIndexes,

        score:
          data.score,

        playerNames:
          data.playerNames,

        twoPairRate:
          data.twoPairRate,
      }),
  }));
