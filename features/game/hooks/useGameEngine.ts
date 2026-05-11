"use client";

import { useReducer } from "react";

import { gameReducer } from "../reducer/gameReducer";
import { createGameInitialState } from "../reducer/gameInitialState";

export const useGameEngine = (
  playerNames?: string[]
) => {
  const [state, dispatch] = useReducer(
    gameReducer,
    playerNames,
    createGameInitialState
  );

  return {
    state,
    dispatch,
  };
};
