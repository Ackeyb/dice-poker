"use client";

import { useReducer } from "react";

import { gameReducer } from "../reducer/gameReducer";
import { gameInitialState } from "../reducer/gameInitialState";

export const useGameEngine = () => {
  const [state, dispatch] = useReducer(
    gameReducer,
    gameInitialState
  );

  return {
    state,
    dispatch,
  };
};