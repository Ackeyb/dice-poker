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
  useSearchParams,
} from "next/navigation";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

const parseStringArrayParam = (
  value: string | null
) => {
  if (!value) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(value) as unknown;

    if (
      Array.isArray(parsed) &&
      parsed.every(
        item => typeof item === "string"
      )
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

const parseNumberArrayParam = (
  value: string | null
) => {
  if (!value) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(value) as unknown;

    if (
      Array.isArray(parsed) &&
      parsed.every(
        item =>
          Number.isInteger(item) &&
          item >= 0
      )
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

const parsePositiveIntegerParam = (
  value: string | null
) => {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed =
    Number(value);

  return parsed > 0
    ? parsed
    : null;
};

const buildGameUrl = (
  playerNames: string[],
  onePairRate: number
) => {
  const params =
    new URLSearchParams({
      players:
        JSON.stringify(playerNames),
      onePairRate:
        String(onePairRate),
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
  const searchParams =
    useSearchParams();

  const {
    winnerIndexes: storedWinnerIndexes,
    loserIndexes: storedLoserIndexes,
    score: storedScore,
    playerNames: storedPlayerNames,
    onePairRate: storedOnePairRate,
  } = useDoubleUpStore();

  const queryWinnerIndexes =
    useMemo(
      () =>
        parseNumberArrayParam(
          searchParams.get("winners")
        ),
      [searchParams]
    );

  const queryLoserIndexes =
    useMemo(
      () =>
        parseNumberArrayParam(
          searchParams.get("losers")
        ),
      [searchParams]
    );

  const queryPlayerNames =
    useMemo(
      () =>
        parseStringArrayParam(
          searchParams.get("players")
        ),
      [searchParams]
    );

  const queryScore =
    useMemo(
      () =>
        parsePositiveIntegerParam(
          searchParams.get("score")
        ),
      [searchParams]
    );

  const queryOnePairRate =
    useMemo(
      () =>
        parsePositiveIntegerParam(
          searchParams.get("onePairRate") ??
          searchParams.get("twoPairRate")
        ),
      [searchParams]
    );

  const winnerIndexes =
    queryWinnerIndexes ??
    storedWinnerIndexes;

  const loserIndexes =
    queryLoserIndexes ??
    storedLoserIndexes;

  const playerNames =
    queryPlayerNames ??
    storedPlayerNames;

  const score =
    queryScore ??
    storedScore;

  const onePairRate =
    queryOnePairRate ??
    storedOnePairRate;

  const getPlayerName = (
    playerIndex: number
  ) =>
    playerNames[playerIndex] ??
    `Player ${playerIndex + 1}`;

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
    onePairRate > 0;

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
            .map(i =>
              getPlayerName(i)
            )
            .join(", ")}
        </div>

        <div className="border border-red-700 p-4 rounded bg-red-900">
          Losers:
          {" "}
          {loserIndexes
            .map(i =>
              getPlayerName(i)
            )
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
        <div className="grid grid-cols-3 gap-2 sm:gap-4">

          <button
            className={`
              min-w-0
              rounded
              border-2
              px-2 py-3
              text-base font-bold
              transition
              sm:px-8 sm:py-4
              sm:text-2xl
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
            <span className="block text-xs font-black tracking-widest sm:text-sm">
              4 / 5 / 6
            </span>
            {choice === "HIGH" && (
              <span className="block text-xs uppercase tracking-widest">
                Selected
              </span>
            )}
          </button>

          <button
            className={`
              min-w-0
              rounded
              border-2
              px-2 py-3
              text-base font-bold
              transition
              sm:px-8 sm:py-4
              sm:text-2xl
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
            <span className="block text-xs font-black tracking-widest sm:text-sm">
              1 / 2 / 3
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
              min-w-0
              border border-red-200
              px-2 py-3 rounded
              text-base font-bold
              bg-red-700
              sm:px-10 sm:py-4
              sm:text-2xl

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
              border border-red-900
              bg-red-950
              text-red-50
              shadow-2xl
              shadow-red-950/50
            "
          >
            <div
              className="
                border-b border-red-900
                bg-gradient-to-r
                from-red-950
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
                  text-red-200
                "
              >
                Double Up Failed
              </div>

              <h2
                className="
                  mt-2
                  text-4xl
                  font-black
                  text-white
                "
              >
                Failure
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
                  Final Score
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

              <button
                type="button"
                className="
                  w-full
                  rounded
                  bg-red-600
                  px-6 py-4
                  text-lg
                  font-black
                  text-white
                  transition
                  hover:bg-red-500
                "
                onClick={handleFinish}
              >
                Finish
              </button>
            </div>
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
                    i =>
                      getPlayerName(i)
                  )
                  .join(", ")

              : loserIndexes
                  .map(
                    i =>
                      getPlayerName(i)
                  )
                  .join(", ")}
          </div>

          <div>
            Loser:
            {" "}

            {isSuccess
              ? loserIndexes
                  .map(
                    i =>
                      getPlayerName(i)
                  )
                  .join(", ")

              : winnerIndexes
                  .map(
                    i =>
                      getPlayerName(i)
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
                    onePairRate
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
          h-[300px]
          sm:h-[480px]
          lg:h-[720px]
          max-h-[75vh]
        "
        panelClassName="
          max-w-6xl
        "
      />

    </div>
  );
};
