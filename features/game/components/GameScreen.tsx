"use client";

import { useGameEngine } from "../hooks/useGameEngine";
import { getPlayerResults }
from "../utils/getPlayerResults";
import { getWinnersAndLosers }
from "../utils/getWinnersAndLosers";
import { calculateScore }
from "../utils/calculateScore";
import { HAND_LABELS }
from "../constants/handLabels";
import { useRouter }
from "next/navigation";
import {
  useDoubleUpStore,
} from "@/features/double-up/store";
import {
  Dice,
} from "@/shared/components/Dice/Dice2D";
import {
  DiceRollOverlay,
} from "@/shared/components/Dice/DiceRollOverlay";
import {
  DiceRollPreloader,
} from "@/shared/components/Dice/DiceRollPreloader";
import {
  TurnCutIn,
} from "./TurnCutIn";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  playerNames?: string[];
  onePairRate?: number;
};

const DEFAULT_ONE_PAIR_RATE = 100;

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
  const params =
    new URLSearchParams({
      players:
        JSON.stringify(playerNames),
    });

  return `/?${params.toString()}`;
};

const buildDoubleUpUrl = (
  data: {
    winnerIndexes: number[];
    loserIndexes: number[];
    score: number;
    playerNames: string[];
    onePairRate: number;
  }
) => {
  const params =
    new URLSearchParams({
      winners:
        JSON.stringify(data.winnerIndexes),
      losers:
        JSON.stringify(data.loserIndexes),
      score:
        String(data.score),
      players:
        JSON.stringify(data.playerNames),
      onePairRate:
        String(data.onePairRate),
      start:
        String(Date.now()),
    });

  return `/doubleup?${params.toString()}`;
};

const getRoundNumber = (
  phase: string
) => {
  if (phase.startsWith("ROUND1")) {
    return 1;
  }

  if (phase.startsWith("ROUND2")) {
    return 2;
  }

  if (phase.startsWith("ROUND3")) {
    return 3;
  }

  return null;
};

const hasPlayerRolledAtLeastOnce = (
  phase: string,
  currentPlayerIndex: number,
  playerIndex: number
) => {
  if (!phase.startsWith("ROUND1")) {
    return true;
  }

  if (phase === "ROUND1_ROLL") {
    return playerIndex < currentPlayerIndex;
  }

  return playerIndex <= currentPlayerIndex;
};

export const GameScreen = ({
  playerNames,
  onePairRate,
}: Props) => {
  const { state, dispatch } = useGameEngine(
    playerNames
  );

  const [
    showRollOverlay,
    setShowRollOverlay,
  ] = useState(false);

  const [
    overlayValues,
    setOverlayValues,
  ] = useState<number[]>([]);

  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    resultActionDismissed,
    setResultActionDismissed,
  ] = useState(false);

  const [
    showSkipRollConfirm,
    setShowSkipRollConfirm,
  ] = useState(false);

  const [
    completedCutInKey,
    setCompletedCutInKey,
  ] = useState<string | null>(null);

  const pendingRollPhaseRef =
    useRef<typeof state.phase | null>(
      null
    );

  const pendingRollIndexesRef =
    useRef<number[]>([]);
  
  useEffect(() => {
    const id =
      setTimeout(() => {
        setMounted(true);
      }, 0);

    return () => {
      clearTimeout(id);
    };
  }, []);

  const currentPlayer =
    state.players[state.currentPlayerIndex];

  const currentPlayerNames =
    state.players.map(player => player.name);

  const effectiveOnePairRate =
    onePairRate ?? DEFAULT_ONE_PAIR_RATE;

  const roundNumber =
    getRoundNumber(state.phase);

  const cutInTriggerKey =
    `${roundNumber}-${state.currentPlayerIndex}`;

  const displayPhase =
    state.phase === "RESULT"
      ? "COMPLETE"
      : state.phase;
  
  const results = getPlayerResults(
  state.players
  );

  const playerSummaries =
    state.players.map((player, index) => {
      const hasRolled =
        hasPlayerRolledAtLeastOnce(
          state.phase,
          state.currentPlayerIndex,
          index
        );

      const result =
        results[index];

      return {
        player,
        playerIndex: index,
        hasRolled,
        hand: result?.hand,
        score:
          hasRolled && result
            ? calculateScore(
                result.hand,
                effectiveOnePairRate
              )
            : null,
      };
    });

  const {
  winners,
  losers,
  } = getWinnersAndLosers(results);

  const currentPlayerResult =
    results.find(
      result =>
        result.playerIndex ===
        state.currentPlayerIndex
    );

  const leaderLabel =
    winners.length > 0
      ? winners
          .map(
            winner =>
              state.players[winner.playerIndex]?.name ??
              `Player ${winner.playerIndex + 1}`
          )
          .join(", ")
      : "-";

  const leaderHandLabel =
    winners.length > 0
      ? HAND_LABELS[winners[0].hand]
      : "-";

  const leaderScoreLabel =
    winners.length > 0
      ? calculateScore(
          winners[0].hand,
          effectiveOnePairRate
        )
      : "-";

  const currentPlayerHandLabel =
    currentPlayerResult
      ? HAND_LABELS[currentPlayerResult.hand]
      : "-";

  const currentPlayerScoreLabel =
    currentPlayerResult
      ? calculateScore(
          currentPlayerResult.hand,
          effectiveOnePairRate
        )
      : "-";
  
  const isRound3Confirm =
    state.phase === "ROUND3_CONFIRM" &&
    completedCutInKey === cutInTriggerKey;

  const canHold =
    state.phase === "ROUND1_HOLD" ||
    state.phase === "ROUND3_HOLD";
  
  const canRoll =
    state.phase === "ROUND1_ROLL" ||
    state.phase === "ROUND2_ROLL" ||
    state.phase === "ROUND3_ROLL" ||
    state.phase === "ROUND3_HOLD";

  const isAnimationLocked =
    state.animationState === "ROLLING";

  const isWaitingNext =
    state.animationState === "WAITING_NEXT";

  const resultScore =
    winners.length > 0
      ? calculateScore(
          winners[0].hand,
          effectiveOnePairRate
        )
      : 0;

  const isTie =
    state.phase === "RESULT" &&
    winners.length === results.length &&
    losers.length === results.length;

  const canStartDoubleUp =
    state.phase === "RESULT" &&
    !isTie &&
    winners.length > 0 &&
    losers.length > 0;

  const showResultActions =
    state.phase === "RESULT" &&
    !resultActionDismissed;
  
  const router = useRouter();

  const setDoubleUpData =
    useDoubleUpStore(
      state => state.setDoubleUpData
    );

  const startDoubleUp = () => {
    if (!canStartDoubleUp) {
      return;
    }

    const doubleUpData = {
      winnerIndexes:
        winners.map(
          winner =>
            winner.playerIndex
        ),

      loserIndexes:
        losers.map(
          loser =>
            loser.playerIndex
        ),

      score: resultScore,
      playerNames: currentPlayerNames,
      onePairRate: effectiveOnePairRate,
    };

    setDoubleUpData(doubleUpData);

    router.push(
      buildDoubleUpUrl(doubleUpData)
    );
  };

  const restartGame = () => {
    router.push(
      buildGameUrl(
        currentPlayerNames,
        effectiveOnePairRate
      )
    );
  };

  const backToSettings = () => {
    router.push(
      buildSettingsUrl(currentPlayerNames)
    );
  };

  const handleRoll = () => {
    if (!canRoll || isAnimationLocked || isWaitingNext) {
      return;
    }

    dispatch({
      type: "SET_ANIMATION_STATE",
      payload: {
        state: "ROLLING",
      },
    });

    pendingRollPhaseRef.current =
      state.phase;
    
    const rollingIndexes =
      currentPlayer.dice.flatMap((die, index) =>
        die.held ? [] : [index]
      );

    pendingRollIndexesRef.current =
      rollingIndexes;

    setShowRollOverlay(true);
    setOverlayValues(
      Array.from(
        { length: rollingIndexes.length },
        () => 1
      )
    );
  };

  const completeRoll = useCallback((rolledValues: number[]) => {
    const phase =
      pendingRollPhaseRef.current;

    const rollIndexes =
      pendingRollIndexesRef.current;

    const values =
      currentPlayer.dice.map((die, index) => {
        const rolledIndex =
          rollIndexes.indexOf(index);

        return rolledIndex === -1
          ? die.value
          : rolledValues[rolledIndex] ?? die.value;
      });

    setShowRollOverlay(false);

    if (values) {
      dispatch({
        type: "ROLL_DICE",
        payload: {
          values,
        },
      });
    }

    if (phase === "ROUND1_ROLL") {
      dispatch({
        type: "SET_PHASE",
        payload: {
          phase: "ROUND1_HOLD",
        },
      });

      dispatch({
        type: "SET_ANIMATION_STATE",
        payload: {
          state: "IDLE",
        },
      });

      pendingRollPhaseRef.current = null;
    } else {
      dispatch({
        type: "SET_ANIMATION_STATE",
        payload: {
          state: "WAITING_NEXT",
        },
      });
    }

    pendingRollIndexesRef.current = [];
  }, [currentPlayer.dice, dispatch]);

  const handleNext = () => {
    if (isAnimationLocked) {
      return;
    }

    const rollPhase =
      pendingRollPhaseRef.current;

    if (isWaitingNext) {
      if (rollPhase === "ROUND1_ROLL") {
        dispatch({
          type: "SET_PHASE",
          payload: {
            phase: "ROUND1_HOLD",
          },
        });
      }

      if (
        rollPhase === "ROUND2_ROLL" ||
        rollPhase === "ROUND3_HOLD" ||
        rollPhase === "ROUND3_ROLL"
      ) {
        dispatch({
          type: "ADVANCE_PHASE",
        });
      }

      dispatch({
        type: "SET_ANIMATION_STATE",
        payload: {
          state: "IDLE",
        },
      });

      pendingRollPhaseRef.current = null;

      return;
    }

    if (
      state.phase === "ROUND2_ROLL" ||
      state.phase === "ROUND3_HOLD" ||
      state.phase === "ROUND3_ROLL"
    ) {
      setShowSkipRollConfirm(true);

      return;
    }

    dispatch({
      type: "ADVANCE_PHASE",
    });
  };

  const confirmSkipRoll = () => {
    setShowSkipRollConfirm(false);

    dispatch({
      type: "ADVANCE_PHASE",
    });
  };

  if (!currentPlayer) {
    return <div>No Player</div>;
  }

  if (!mounted) {
    return null;
  }

  return (
    <main
      className="
        min-h-screen
        bg-zinc-950
        text-zinc-100
        px-4 py-4
      "
    >
      <div
        className="
          mx-auto
          max-w-3xl
          space-y-4
        "
      >
        <header
          className="
            flex items-center
            justify-between gap-3
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-widest
                text-red-400
              "
            >
              Dice Poker
            </p>
            <h1
              className="
                text-3xl
                font-bold
                text-white
              "
            >
              Main Game
            </h1>
          </div>

          <div
            className="
              rounded
              border border-zinc-800
              bg-zinc-900
              px-3 py-2
              text-right
            "
          >
            <div className="text-xs text-zinc-500">
              Phase
            </div>
            <div
              className="
                text-sm
                font-bold
                text-red-300
              "
            >
              {displayPhase}
            </div>
          </div>
        </header>

        <section
          className="
            rounded
            border border-zinc-800
            bg-zinc-900
            p-4
            shadow-xl
          "
        >
          <div
            className="
              flex items-center
              justify-between gap-3
            "
          >
            <div>
              <div className="text-xs text-zinc-500">
                Current Player
              </div>
              <div
                className="
                  text-2xl
                  font-bold
                  text-white
                "
              >
                {currentPlayer.name}
              </div>
            </div>

            {isWaitingNext && (
              <div
                className="
                  rounded
                  bg-red-950
                  px-3 py-2
                  text-sm
                  font-bold
                  text-red-200
                "
              >
                NEXT waiting
              </div>
            )}
          </div>

          <div
            className="
              mt-4
              grid grid-cols-5 gap-1.5
              sm:gap-3
            "
          >
            {currentPlayer.dice.map((die, index) => (
              <Dice
                key={die.id}
                value={die.value}
                held={die.held}
                disabled={
                  !canHold ||
                  isAnimationLocked ||
                  isWaitingNext
                }
                className="
                  h-11 w-11
                  border-zinc-700
                  bg-zinc-100
                  text-lg
                  text-zinc-950
                  sm:h-16 sm:w-16
                  sm:text-2xl
                "
                onClick={() => {
                  if (
                    !canHold ||
                    isAnimationLocked ||
                    isWaitingNext
                  ) {
                    return;
                  }

                  dispatch({
                    type: "TOGGLE_HOLD",
                    payload: {
                      dieIndex: index,
                    },
                  });
                }}
              />
            ))}
          </div>

          <div
            className="
              mt-4
              flex flex-wrap gap-4
            "
          >
            <button
              disabled={
                !canRoll ||
                isAnimationLocked ||
                isWaitingNext
              }
              className={`
                rounded
                bg-red-600
                min-w-36
                px-6 py-3
                font-bold
                text-white
                transition
                hover:bg-red-500

                ${
                  !canRoll ||
                  isAnimationLocked ||
                  isWaitingNext
                    ? "opacity-50"
                    : ""
                }
              `}
              onClick={handleRoll}
            >
              サイコロを振る
            </button>

            <button
              className="
                rounded
                border border-zinc-700
                bg-zinc-950
                min-w-36
                px-6 py-3
                font-bold
                text-zinc-100
                transition
                hover:border-red-500
              "
              disabled={isAnimationLocked}
              onClick={handleNext}
            >
              Next
            </button>
          </div>

        </section>

        <section
          className="
            rounded
            border border-zinc-800
            bg-zinc-900
            p-4
          "
        >
          <div
            className="
              flex items-end
              justify-between gap-3
            "
          >
            <div>
              <div
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-widest
                  text-red-400
                "
              >
                Standings
              </div>
              <h2
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >
                Current Hands
              </h2>
            </div>
          </div>

          <div
            className="
              mt-3
              grid gap-3
              sm:grid-cols-2
            "
          >
            {playerSummaries.map(summary => (
              <div
                key={summary.playerIndex}
                className={`
                  rounded
                  border
                  p-3
                  ${
                    summary.playerIndex ===
                    state.currentPlayerIndex
                      ? "border-red-800 bg-red-950/40"
                      : "border-zinc-800 bg-zinc-950"
                  }
                `}
              >
                <div
                  className="
                    flex items-start
                    justify-between gap-3
                  "
                >
                  <div>
                    <div className="text-sm text-zinc-500">
                      Player
                    </div>
                    <div
                      className="
                        text-lg
                        font-bold
                        text-white
                      "
                    >
                      {summary.player.name}
                    </div>
                  </div>

                  {summary.playerIndex ===
                    state.currentPlayerIndex && (
                    <div
                      className="
                        rounded
                        bg-red-900
                        px-2 py-1
                        text-xs
                        font-bold
                        text-red-100
                      "
                    >
                      Turn
                    </div>
                  )}
                </div>

                {summary.hasRolled ? (
                  <>
                    <div
                      className="
                        mt-3
                        grid grid-cols-5 gap-1.5
                      "
                    >
                      {summary.player.dice.map(die => (
                        <div
                          key={die.id}
                          className="
                            flex h-8 w-8
                            items-center justify-center
                            rounded
                            border border-zinc-700
                            bg-zinc-100
                            text-sm
                            font-black
                            text-zinc-950
                          "
                        >
                          {die.value}
                        </div>
                      ))}
                    </div>

                    <div
                      className="
                        mt-3
                        grid grid-cols-2 gap-2
                        text-sm
                      "
                    >
                      <div
                        className="
                          rounded
                          border border-zinc-800
                          bg-zinc-900
                          p-2
                        "
                      >
                        <div className="text-zinc-500">
                          Hand
                        </div>
                        <div
                          className="
                            font-bold
                            text-white
                          "
                        >
                          {summary.hand
                            ? HAND_LABELS[summary.hand]
                            : "-"}
                        </div>
                      </div>

                      <div
                        className="
                          rounded
                          border border-zinc-800
                          bg-zinc-900
                          p-2
                        "
                      >
                        <div className="text-zinc-500">
                          Score
                        </div>
                        <div
                          className="
                            font-bold
                            text-red-300
                          "
                        >
                          {summary.score}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    className="
                      mt-3
                      rounded
                      border border-dashed
                      border-zinc-700
                      bg-zinc-950
                      p-3
                      text-sm
                      font-bold
                      text-zinc-400
                    "
                  >
                    ROLL前
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {isRound3Confirm && (
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
                Round 3 Decision
              </div>

              <h2
                className="
                  mt-2
                  text-3xl
                  font-black
                  text-white
                "
              >
                {currentPlayer.name}のターン
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                3rd ROLLするか、SKIPして勝負します。
              </p>
            </div>

            <div
              className="
                grid gap-3
                p-5
              "
            >
              <div
                className="
                  grid gap-3
                  sm:grid-cols-2
                "
              >
                <div
                  className="
                    rounded
                    border border-red-900
                    bg-red-950/40
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
                    Current Leader
                  </div>
                  <div
                    className="
                      mt-1
                      text-base
                      font-black
                      text-white
                    "
                  >
                    {leaderLabel}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Hand: {leaderHandLabel}
                  </div>
                  <div className="mt-0.5 text-xs text-red-200">
                    Score: {leaderScoreLabel}
                  </div>
                </div>

                <div
                  className="
                    rounded
                    border border-zinc-800
                    bg-zinc-900
                    p-3
                  "
                >
                  <div
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-widest
                      text-zinc-400
                    "
                  >
                    This Player
                  </div>
                  <div
                    className="
                      mt-1
                      text-base
                      font-black
                      text-white
                    "
                  >
                    {currentPlayer.name}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Hand: {currentPlayerHandLabel}
                  </div>
                  <div className="mt-0.5 text-xs text-red-200">
                    Score: {currentPlayerScoreLabel}
                  </div>
                </div>
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
                  px-5 py-4
                  text-lg
                  font-black
                  text-white
                  transition
                  hover:bg-red-500
                "
                onClick={() => {
                  dispatch({
                    type: "SET_PHASE",
                    payload: {
                      phase: "ROUND3_HOLD",
                    },
                  });
                }}
              >
                3rd Roll
              </button>

              <button
                type="button"
                className="
                  rounded
                  border border-zinc-700
                  bg-zinc-900
                  px-5 py-4
                  text-lg
                  font-black
                  text-zinc-100
                  transition
                  hover:border-red-500
                  hover:text-red-200
                "
                onClick={() => {
                  dispatch({
                    type: "ADVANCE_PHASE",
                  });
                }}
              >
                Skip
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSkipRollConfirm && (
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
                Skip Roll
              </div>

              <h2
                className="
                  mt-2
                  text-3xl
                  font-black
                  text-white
                "
              >
                Continue without Roll?
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                現在の出目のまま次のフェーズへ進みます。
              </p>
            </div>

            <div
              className="
                grid gap-3
                p-5
                sm:grid-cols-2
              "
            >
              <button
                type="button"
                className="
                  rounded
                  bg-red-600
                  px-5 py-4
                  text-lg
                  font-black
                  text-white
                  transition
                  hover:bg-red-500
                "
                onClick={confirmSkipRoll}
              >
                Continue
              </button>

              <button
                type="button"
                className="
                  rounded
                  border border-zinc-700
                  bg-zinc-900
                  px-5 py-4
                  text-lg
                  font-black
                  text-zinc-100
                  transition
                  hover:border-red-500
                  hover:text-red-200
                "
                onClick={() => {
                  setShowSkipRollConfirm(false);
                }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultActions && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/70
            px-4
          "
        >
          <div
            className="
              w-full
              max-w-md
              rounded-lg
              border border-zinc-700
              bg-zinc-900
              p-5
              text-zinc-100
              shadow-2xl
            "
          >
            <h2
              className="
                text-2xl
                font-bold
                text-white
              "
            >
              Game Complete
            </h2>

            <div
              className="
                mt-4
                grid gap-3
              "
            >
              <div
                className="
                  rounded
                  border border-red-900
                  bg-red-950/40
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
                    text-lg
                    font-black
                    text-white
                  "
                >
                  {leaderLabel}
                </div>
              </div>

              <div
                className="
                  grid gap-3
                  sm:grid-cols-2
                "
              >
                <div
                  className="
                    rounded
                    border border-zinc-800
                    bg-zinc-950
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
                      text-base
                      font-bold
                      text-zinc-100
                    "
                  >
                    {losers.length > 0
                      ? losers
                          .map(
                            loser =>
                              state.players[loser.playerIndex]
                                ?.name ??
                              `Player ${loser.playerIndex + 1}`
                          )
                          .join(", ")
                      : "-"}
                  </div>
                </div>

                <div
                  className="
                    rounded
                    border border-zinc-800
                    bg-zinc-950
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
                    Winner Score
                  </div>
                  <div
                    className="
                      mt-1
                      text-base
                      font-bold
                      text-red-300
                    "
                  >
                    {resultScore}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="
                mt-5
                grid gap-3
                sm:grid-cols-2
              "
            >
              <button
                type="button"
                disabled={!canStartDoubleUp}
                onClick={startDoubleUp}
                className={`
                  rounded
                  bg-red-600
                  px-5 py-3
                  font-bold
                  text-white
                  transition
                  hover:bg-red-500

                  ${!canStartDoubleUp ? "opacity-50" : ""}
                `}
              >
                Double Up
              </button>

              <button
                type="button"
                onClick={restartGame}
                className="
                  rounded
                  border border-red-700
                  bg-red-950
                  px-5 py-3
                  font-bold
                  text-red-100
                  transition
                  hover:border-red-400
                "
              >
                Play Again
              </button>

              <button
                type="button"
                onClick={() => {
                  setResultActionDismissed(true);
                  backToSettings();
                }}
                className="
                  sm:col-span-2
                  rounded
                  border border-zinc-700
                  bg-zinc-950
                  px-5 py-3
                  font-bold
                  text-zinc-100
                  transition
                  hover:border-red-500
                "
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <DiceRollOverlay

        open={showRollOverlay}

        values={overlayValues}

        onComplete={completeRoll}

        diceScale={15}

        diceClassName="
          h-[260px]
          sm:h-[420px]
          lg:h-[680px]
          max-h-[72vh]
        "

        panelClassName="
          max-w-6xl
        "
      />

      <DiceRollPreloader scale={15} />

      <TurnCutIn
        roundNumber={roundNumber}
        playerName={currentPlayer.name}
        triggerKey={cutInTriggerKey}
        onComplete={setCompletedCutInKey}
      />

    </main>
  );
};
