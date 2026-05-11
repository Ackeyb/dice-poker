"use client";

import { useState } from "react";

import {
  DoubleUpChoice,
  DoubleUpStatus,
} from "../types";

export const useDoubleUpGame = (
  initialScore: number
) => {

  const [
    currentScore,
    setCurrentScore,
  ] = useState(initialScore);

  const [
    choice,
    setChoice,
  ] = useState<
    DoubleUpChoice | null
  >(null);

  const [
    rolledValue,
    setRolledValue,
  ] = useState<number | null>(
    null
  );

  const [
    isSuccess,
    setIsSuccess,
  ] = useState<boolean | null>(
    null
  );

  const [
    status,
    setStatus,
  ] = useState<DoubleUpStatus>(
    "SELECT"
  );

  const handleRoll = () => {

    if (!choice) {
      return;
    }

    const value =
      Math.floor(
        Math.random() * 6
      ) + 1;

    setRolledValue(value);

    const success =
      choice === "HIGH"
        ? value >= 4
        : value <= 3;

    setIsSuccess(success);

    if (success) {
      setCurrentScore(
        prev => prev * 2
      );
    }

    setStatus("ROLLED");
  };

  const handleContinue = () => {

    setChoice(null);

    setRolledValue(null);

    setIsSuccess(null);

    setStatus("SELECT");
  };

  const handleFinish = () => {
    setStatus("FINISHED");
  };

  return {

    currentScore,

    choice,

    setChoice,

    rolledValue,

    isSuccess,

    status,

    handleRoll,

    handleContinue,

    handleFinish,
  };
};