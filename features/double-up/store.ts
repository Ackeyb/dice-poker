import { create } from "zustand";

type DoubleUpState = {

  winnerIndexes: number[];

  loserIndexes: number[];

  score: number;

  setDoubleUpData: (
    data: {
      winnerIndexes: number[];
      loserIndexes: number[];
      score: number;
    }
  ) => void;
};

export const useDoubleUpStore =
  create<DoubleUpState>((set) => ({

    winnerIndexes: [],

    loserIndexes: [],

    score: 0,

    setDoubleUpData: (data) =>
      set({
        winnerIndexes:
          data.winnerIndexes,

        loserIndexes:
          data.loserIndexes,

        score:
          data.score,
      }),
  }));