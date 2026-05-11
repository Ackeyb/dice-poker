"use client";

import {
  useDoubleUpStore,
} from "../store";

import {
  useDoubleUpGame,
} from "../hooks/useDoubleUpGame";

import {
  Dice,
} from "@/shared/components/Dice/Dice2D";

import {
  DiceRollOverlay,
} from "@/shared/components/Dice/DiceRollOverlay";

import {
  useCallback,
  useState,
} from "react";

export const DoubleUpScreen =
  () => {

  const {
    winnerIndexes,
    loserIndexes,
    score,
  } = useDoubleUpStore();

  const {

    currentScore,

    choice,

    setChoice,

    rolledValue,

    isSuccess,

    status,

    resolveRoll,

    handleContinue,

    handleFinish,

  } = useDoubleUpGame(score);

  const [
    isRollOverlayOpen,
    setIsRollOverlayOpen,
  ] = useState(false);

  const [
    overlayValues,
    setOverlayValues,
  ] = useState<number[]>([]);

  const isRolling =
    isRollOverlayOpen;

  const handleRoll = () => {
    if (!choice || isRolling) {
      return;
    }

    setOverlayValues([1]);
    setIsRollOverlayOpen(true);
  };

  const completeRoll = useCallback((values: number[]) => {
    setIsRollOverlayOpen(false);

    const value =
      values[0];

    if (typeof value === "number") {
      resolveRoll(value);
    }
  }, [resolveRoll]);

  return (

    <div
      className="
        min-h-screen
        bg-red-950
        text-red-50
        p-6
        space-y-8
      "
    >

      <div className="text-5xl font-bold">
        Double Up
      </div>

      <div
        className="
          grid gap-4
          md:grid-cols-3
          text-xl
        "
      >

        <div className="border border-red-700 p-4 rounded bg-red-900">
          Winners:
          {" "}
          {winnerIndexes
            .map(i => i + 1)
            .join(", ")}
        </div>

        <div className="border border-red-700 p-4 rounded bg-red-900">
          Losers:
          {" "}
          {loserIndexes
            .map(i => i + 1)
            .join(", ")}
        </div>

        <div className="border border-red-700 p-4 rounded bg-red-900">
          Score:
          {" "}
          <span className="text-3xl font-bold">
            {currentScore}
          </span>
        </div>

      </div>

      {status === "SELECT" && (
        <div className="flex flex-wrap gap-4">

          <button
            className={`
              border border-red-500
              px-8 py-4 rounded
              text-2xl font-bold
              bg-red-900
              ${
                choice === "HIGH"
                  ? "bg-red-500 text-white"
                  : ""
              }
            `}
            onClick={() => {
              setChoice("HIGH");
            }}
          >
            High
          </button>

          <button
            className={`
              border border-red-500
              px-8 py-4 rounded
              text-2xl font-bold
              bg-red-900
              ${
                choice === "LOW"
                  ? "bg-red-500 text-white"
                  : ""
              }
            `}
            onClick={() => {
              setChoice("LOW");
            }}
          >
            Low
          </button>

          <button
            disabled={
              choice === null ||
              isRolling
            }
            className={`
              border border-red-200
              px-10 py-4 rounded
              text-2xl font-bold
              bg-red-700

              ${
                choice === null ||
                isRolling
                  ? "opacity-50"
                  : ""
              }
            `}
            onClick={handleRoll}
          >
            Roll
          </button>

        </div>
      )}

      {status === "ROLLED" && (
        <div className="space-y-8">

          <div className="flex justify-center">

            {rolledValue && (
              <Dice
                value={rolledValue}
                disabled
                className="
                  w-32 h-32
                  text-6xl
                  border-4
                  border-red-700
                  bg-red-50
                  text-red-950
                  opacity-100
                  shadow-xl
                "
              />
            )}

          </div>

          <div className="text-4xl font-bold">
            {isSuccess
              ? "Success"
              : "Failure"}
          </div>

          <div className="flex flex-wrap gap-4">

            <button
              disabled={!isSuccess}
              className={`
                border border-red-400
                px-8 py-4 rounded
                text-xl font-bold
                bg-red-800
                ${!isSuccess ? "opacity-50" : ""}
              `}
              onClick={handleContinue}
            >
              Continue
            </button>

            <button
              className="
                border border-red-200
                px-8 py-4 rounded
                text-xl font-bold
                bg-red-700
              "
              onClick={handleFinish}
            >
              Finish
            </button>

          </div>

        </div>
      )}

      {status === "FINISHED" && (

        <div
          className="
            space-y-4
            text-xl
            border border-red-700
            bg-red-900
            p-6 rounded
          "
        >

          <div className="text-4xl font-bold">
            Final Result
          </div>

          <div>
            Final Score:
            {" "}
            {currentScore}
          </div>

          <div>
            Winner:
            {" "}

            {isSuccess
              ? winnerIndexes
                  .map(
                    i => i + 1
                  )
                  .join(", ")

              : loserIndexes
                  .map(
                    i => i + 1
                  )
                  .join(", ")}
          </div>

          <div>
            Loser:
            {" "}

            {isSuccess
              ? loserIndexes
                  .map(
                    i => i + 1
                  )
                  .join(", ")

              : winnerIndexes
                  .map(
                    i => i + 1
                  )
                  .join(", ")}
          </div>

        </div>

      )}

      <DiceRollOverlay
        open={isRollOverlayOpen}
        values={overlayValues}
        onComplete={completeRoll}
        diceScale={10}
        diceClassName="
          h-[520px]
        "
        panelClassName="
          max-w-3xl
        "
      />

    </div>
  );
};
