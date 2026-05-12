"use client";

import { useGameEngine } from "../hooks/useGameEngine";
import { getPlayerResults }
from "../utils/getPlayerResults";
import { getWinnersAndLosers }
from "../utils/getWinnersAndLosers";
import { HAND_STRENGTH }
from "../constants/handStrength";
import { calculateScore }
from "../utils/calculateScore";
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
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  playerNames?: string[];
  twoPairRate?: number;
};

export const GameScreen = ({
  playerNames,
  twoPairRate,
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
  
  const results = getPlayerResults(
  state.players
  );

  const {
  winners,
  losers,
  } = getWinnersAndLosers(results);
  
  const isRound3Confirm =
    state.phase === "ROUND3_CONFIRM"; 

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
          twoPairRate
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

    setDoubleUpData({
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
    });

    router.push("/doubleup");
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
              {state.phase}
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
              flex flex-wrap gap-3
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
                  border-zinc-700
                  bg-zinc-100
                  text-zinc-950
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
              flex flex-wrap gap-3
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
              Roll
            </button>

            <button
              className="
                rounded
                border border-zinc-700
                bg-zinc-950
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

          {isRound3Confirm && (
            <div
              className="
                mt-3
                flex flex-wrap gap-3
              "
            >
              <button
                className="
                  rounded
                  bg-red-600
                  px-5 py-3
                  font-bold
                  text-white
                  transition
                  hover:bg-red-500
                "
                disabled={
                  isAnimationLocked ||
                  isWaitingNext
                }
                onClick={() => {
                  if (
                    isAnimationLocked ||
                    isWaitingNext
                  ) {
                    return;
                  }

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
                className="
                  rounded
                  border border-zinc-700
                  bg-zinc-950
                  px-5 py-3
                  font-bold
                  text-zinc-100
                  transition
                  hover:border-red-500
                "
                disabled={
                  isAnimationLocked ||
                  isWaitingNext
                }
                onClick={() => {
                  if (
                    isAnimationLocked ||
                    isWaitingNext
                  ) {
                    return;
                  }

                  dispatch({
                    type: "ADVANCE_PHASE",
                  });
                }}
              >
                Skip
              </button>
            </div>
          )}
        </section>

        {state.phase === "RESULT" && (
          <section
            className="
              rounded
              border border-zinc-800
              bg-zinc-900
              p-4
            "
          >
            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              Result
            </h2>

            <div
              className="
                mt-3
                grid gap-3
                sm:grid-cols-2
              "
            >
              {results.map(result => (
                <div
                  key={result.playerIndex}
                  className="
                    rounded
                    border border-zinc-800
                    bg-zinc-950
                    p-3
                  "
                >
                  <div className="text-sm text-zinc-500">
                    Player {result.playerIndex + 1}
                  </div>
                  <div
                    className="
                      text-lg
                      font-bold
                      text-white
                    "
                  >
                    {result.hand}
                  </div>
                  <div className="text-sm text-zinc-400">
                    Strength: {HAND_STRENGTH[result.hand]}
                  </div>
                  <div
                    className="
                      text-sm
                      font-bold
                      text-red-300
                    "
                  >
                    Score:
                    {" "}
                    {calculateScore(
                      result.hand,
                      twoPairRate
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

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
              Game Result
            </h2>

            <div className="mt-4 space-y-3">
              <div
                className="
                  rounded
                  border border-zinc-800
                  bg-zinc-950
                  p-3
                "
              >
                <div className="text-sm text-zinc-500">
                  {isTie ? "Tie" : "Winners"}
                </div>
                <div
                  className="
                    mt-1
                    font-bold
                    text-red-300
                  "
                >
                  {(isTie ? results : winners)
                    .map(result =>
                      `Player ${result.playerIndex + 1}`
                    )
                    .join(", ")}
                </div>
              </div>

              {!isTie && (
                <div
                  className="
                    rounded
                    border border-zinc-800
                    bg-zinc-950
                    p-3
                  "
                >
                  <div className="text-sm text-zinc-500">
                    Losers
                  </div>
                  <div
                    className="
                      mt-1
                      font-bold
                      text-zinc-200
                    "
                  >
                    {losers
                      .map(result =>
                        `Player ${result.playerIndex + 1}`
                      )
                      .join(", ")}
                  </div>
                </div>
              )}
            </div>

            <div
              className="
                mt-5
                flex flex-col gap-3
                sm:flex-row
              "
            >
              <button
                type="button"
                disabled={!canStartDoubleUp}
                onClick={startDoubleUp}
                className={`
                  flex-1
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
                onClick={() => {
                  setResultActionDismissed(true);
                  router.push("/");
                }}
                className="
                  flex-1
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
                Finish
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
          h-[900px]
          max-h-[85vh]
        "

        panelClassName="
          max-w-6xl
        "
      />

      <DiceRollPreloader scale={15} />

    </main>
  );
};
