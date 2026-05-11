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

    handleRoll,

    handleContinue,

    handleFinish,

  } = useDoubleUpGame(score);

  return (

    <div className="p-4 space-y-4">

      <div className="text-2xl">
        Double Up
      </div>

      <div>
        Winners:
        {" "}
        {winnerIndexes
          .map(i => i + 1)
          .join(", ")}
      </div>

      <div>
        Losers:
        {" "}
        {loserIndexes
          .map(i => i + 1)
          .join(", ")}
      </div>

      <div>
        Score:
        {" "}
        {currentScore}
      </div>

      {status === "SELECT" && (
        <div className="flex gap-2">

          <button
            className={`
              border px-4 py-2 rounded
              ${
                choice === "HIGH"
                  ? "bg-yellow-300"
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
              border px-4 py-2 rounded
              ${
                choice === "LOW"
                  ? "bg-yellow-300"
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
              choice === null
            }
            className={`
              border px-4 py-2 rounded

              ${
                choice === null
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
        <div className="flex justify-center">

          {rolledValue && (
            <Dice
              value={rolledValue}
              disabled
            />
          )}

        </div>
      )}

      {status === "FINISHED" && (

        <div className="space-y-2">

          <div className="text-xl">
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

    </div>
  );
};