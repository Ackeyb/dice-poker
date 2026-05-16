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
        bg-zinc-950
        px-4 py-6
        text-zinc-100
      "
    >

      {status === "SELECT" && (
        <div
          className="
            mx-auto
            w-full max-w-xl
            overflow-hidden
            rounded-lg
            border border-red-900
            bg-zinc-950
            shadow-2xl
            shadow-red-950/40
          "
        >
          <div
            className="
              border-b border-red-950
              bg-gradient-to-r
              from-red-950
              via-zinc-900
              to-zinc-950
              p-5
            "
          >
            <div
              className="
                text-xs
                font-black
                uppercase
                tracking-widest
                text-red-400
              "
            >
              Double Up
            </div>
            <h1
              className="
                mt-2
                text-3xl
                font-black
                text-white
              "
            >
              High or Low
            </h1>
          </div>

          <div className="grid gap-5 p-5">
            <div
              className="
                rounded
                border border-red-900
                bg-red-950/40
                p-5
                text-center
              "
            >
              <div
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-widest
                  text-red-300
                "
              >
                Current Score
              </div>
              <div
                className="
                  mt-2
                  text-5xl
                  font-black
                  text-white
                "
              >
                {currentScore}
              </div>
            </div>

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
                      ? "border-white bg-red-600 text-white shadow-xl shadow-red-500/20"
                      : "border-red-900 bg-zinc-950 text-red-200 hover:border-red-500"
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
                      ? "border-white bg-red-600 text-white shadow-xl shadow-red-500/20"
                      : "border-red-900 bg-zinc-950 text-red-200 hover:border-red-500"
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
                  rounded
                  border border-red-700
                  bg-red-600
                  px-2 py-3
                  text-base font-bold
                  text-white
                  transition
                  hover:bg-red-500
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
          </div>
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
              bg-zinc-950
              text-zinc-100
              shadow-2xl
              shadow-red-950/40
            "
          >
            <div
              className="
                border-b border-red-950
                bg-gradient-to-r
                from-red-950
                via-zinc-900
                to-zinc-950
                p-5
              "
            >
              <div
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-widest
                  text-red-400
                "
              >
                Double Up Failed
              </div>

              <h2
                className="
                  mt-2
                   text-3xl
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
                  border border-red-900
                  bg-red-950/40
                  p-4
                  text-center
                "
              >
                <div className="text-sm text-red-300">
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
              border border-red-900
              bg-zinc-950
              text-zinc-100
              shadow-2xl
              shadow-red-950/40
            "
          >
            <div
              className="
                border-b border-red-950
                bg-gradient-to-r
                from-red-950
                via-zinc-900
                to-zinc-950
                p-5
              "
            >
              <div
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-widest
                  text-red-400
                "
              >
                Double Up Success
              </div>

              <h2
                className="
                  mt-2
                  text-3xl
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
                  border border-red-900
                  bg-red-950/40
                  p-4
                  text-center
                "
              >
                <div className="text-sm text-red-300">
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

              <div className="text-center text-sm text-zinc-300">
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
                    bg-red-600
                    px-6 py-4
                    text-lg
                    font-black
                    text-white
                    transition
                    hover:bg-red-500
                  "
                  onClick={handleContinue}
                >
                  Continue
                </button>

                <button
                  type="button"
                  className="
                    rounded
                    border border-zinc-700
                    bg-zinc-950
                    px-6 py-4
                    text-lg
                    font-black
                    text-zinc-100
                    transition
                    hover:border-red-500
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
            mx-auto
            w-full max-w-xl
            overflow-hidden
            rounded-lg
            border border-red-900
            bg-zinc-950
            text-red-50
            shadow-2xl
            shadow-red-950/40
          "
        >

          <div
            className="
              border-b border-red-950
              bg-gradient-to-r
              from-red-950
              via-zinc-900
              to-zinc-950
              p-5
            "
          >
            <div
              className="
                text-xs
                font-black
                uppercase
                tracking-widest
                text-red-400
              "
            >
              Double Up Complete
            </div>

            <h2
              className="
                mt-2
                text-3xl
                font-black
                text-white
              "
            >
              Final Result
            </h2>
          </div>

          <div className="grid gap-5 p-5">
            <div
              className="
                rounded
                border border-red-900
                bg-red-950/40
                p-5
                text-center
              "
            >
              <div
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-widest
                  text-red-300
                "
              >
                Final Score
              </div>
              <div
                className="
                  mt-2
                  text-6xl
                  font-black
                  text-white
                "
              >
                {currentScore}
              </div>

              <div
                className="
                  mt-5
                  grid gap-3
                  text-left
                  sm:grid-cols-2
                "
              >
                <div
                  className="
                    rounded
                    border border-red-900
                    bg-zinc-950/70
                    p-3
                  "
                >
                  <div
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-widest
                      text-red-300
                    "
                  >
                    Winner
                  </div>
                  <div
                    className="
                      mt-1
                      text-sm
                      font-bold
                      text-white
                    "
                  >
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
                </div>

                <div
                  className="
                    rounded
                    border border-zinc-800
                    bg-zinc-950/70
                    p-3
                  "
                >
                  <div
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-widest
                      text-zinc-500
                    "
                  >
                    Loser
                  </div>
                  <div
                    className="
                      mt-1
                      text-sm
                      font-bold
                      text-zinc-100
                    "
                  >
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
                </div>
              </div>
            </div>
          </div>

          <div
            className="
              grid gap-3
              px-5 pb-5
              sm:grid-cols-2
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
                px-6 py-4
                font-black
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
                border border-zinc-700
                bg-zinc-950
                px-6 py-4
                font-black
                text-zinc-100
                transition
                hover:border-red-500
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
