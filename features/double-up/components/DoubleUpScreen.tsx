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
  useRouter,
} from "next/navigation";

import {
  useCallback,
  useState,
} from "react";

const buildGameUrl = (
  playerNames: string[],
  twoPairRate: number
) => {
  const params =
    new URLSearchParams({
      players:
        JSON.stringify(playerNames),
      twoPairRate:
        String(twoPairRate),
      restart:
        String(Date.now()),
    });

  return `/game?${params.toString()}`;
};

const buildSettingsUrl = (
  playerNames: string[]
) => {
  if (playerNames.length === 0) {
    return "/";
  }

  const params =
    new URLSearchParams({
      players:
        JSON.stringify(playerNames),
    });

  return `/?${params.toString()}`;
};

export const DoubleUpScreen =
  () => {

  const router = useRouter();

  const {
    winnerIndexes,
    loserIndexes,
    score,
    playerNames,
    twoPairRate,
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

  const canRestart =
    playerNames.length >= 2 &&
    twoPairRate > 0;

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
              rounded
              border-2
              px-8 py-4
              text-2xl font-bold
              transition
              ${
                choice === "HIGH"
                  ? "border-white bg-red-500 text-white shadow-xl shadow-red-500/30"
                  : "border-red-700 bg-red-950 text-red-200 hover:border-red-400"
              }
            `}
            onClick={() => {
              setChoice("HIGH");
            }}
          >
            <span className="block">
              High
            </span>
            {choice === "HIGH" && (
              <span className="block text-xs uppercase tracking-widest">
                Selected
              </span>
            )}
          </button>

          <button
            className={`
              rounded
              border-2
              px-8 py-4
              text-2xl font-bold
              transition
              ${
                choice === "LOW"
                  ? "border-white bg-red-500 text-white shadow-xl shadow-red-500/30"
                  : "border-red-700 bg-red-950 text-red-200 hover:border-red-400"
              }
            `}
            onClick={() => {
              setChoice("LOW");
            }}
          >
            <span className="block">
              Low
            </span>
            {choice === "LOW" && (
              <span className="block text-xs uppercase tracking-widest">
                Selected
              </span>
            )}
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

      {status === "ROLLED" && !isSuccess && (
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
            Failure
          </div>

          <div className="flex flex-wrap gap-4">

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

      {status === "ROLLED" && isSuccess && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/75
            px-4
          "
        >
          <div
            className="
              w-full
              max-w-md
              overflow-hidden
              rounded-lg
              border border-red-700
              bg-red-950
              text-red-50
              shadow-2xl
              shadow-red-950/50
            "
          >
            <div
              className="
                border-b border-red-800
                bg-gradient-to-r
                from-red-700
                via-red-900
                to-red-950
                p-5
              "
            >
              <div
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-widest
                  text-red-100
                "
              >
                Double Up Success
              </div>

              <h2
                className="
                  mt-2
                  text-4xl
                  font-black
                  text-white
                "
              >
                Success
              </h2>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex justify-center">
                {rolledValue && (
                  <Dice
                    value={rolledValue}
                    disabled
                    className="
                      h-28 w-28
                      border-4
                      border-red-200
                      bg-red-50
                      text-6xl
                      text-red-950
                      opacity-100
                      shadow-xl
                    "
                  />
                )}
              </div>

              <div
                className="
                  rounded
                  border border-red-800
                  bg-red-900
                  p-4
                  text-center
                "
              >
                <div className="text-sm text-red-200">
                  Current Score
                </div>
                <div
                  className="
                    mt-1
                    text-5xl
                    font-black
                    text-white
                  "
                >
                  {currentScore}
                </div>
              </div>

              <div className="text-center text-sm text-red-100">
                Continue?
              </div>

              <div
                className="
                  grid gap-3
                  sm:grid-cols-2
                "
              >
                <button
                  type="button"
                  className="
                    rounded
                    bg-red-500
                    px-6 py-4
                    text-lg
                    font-black
                    text-white
                    transition
                    hover:bg-red-400
                  "
                  onClick={handleContinue}
                >
                  Continue
                </button>

                <button
                  type="button"
                  className="
                    rounded
                    border border-red-300
                    bg-red-950
                    px-6 py-4
                    text-lg
                    font-black
                    text-red-50
                    transition
                    hover:border-white
                  "
                  onClick={handleFinish}
                >
                  Finish
                </button>
              </div>
            </div>
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

          <div
            className="
              flex flex-col gap-3
              pt-3
              sm:flex-row
            "
          >
            <button
              type="button"
              disabled={!canRestart}
              onClick={() => {
                if (!canRestart) {
                  return;
                }

                router.push(
                  buildGameUrl(
                    playerNames,
                    twoPairRate
                  )
                );
              }}
              className={`
                rounded
                bg-red-600
                px-6 py-3
                font-bold
                text-white
                transition
                hover:bg-red-500

                ${!canRestart ? "opacity-50" : ""}
              `}
            >
              Play Again
            </button>

            <button
              type="button"
              onClick={() => {
                router.push(
                  buildSettingsUrl(playerNames)
                );
              }}
              className="
                rounded
                border border-red-300
                bg-red-950
                px-6 py-3
                font-bold
                text-red-50
                transition
                hover:border-white
              "
            >
              Settings
            </button>
          </div>

        </div>

      )}

      <DiceRollOverlay
        open={isRollOverlayOpen}
        values={overlayValues}
        onComplete={completeRoll}
        diceScale={20}
        diceClassName="
          h-[1040px]
          max-h-[85vh]
        "
        panelClassName="
          max-w-6xl
        "
      />

    </div>
  );
};
