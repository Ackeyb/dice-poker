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
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const GameScreen = () => {
  const { state, dispatch } = useGameEngine();

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

  const pendingRollPhaseRef =
    useRef<typeof state.phase | null>(
      null
    );

  const pendingRollValuesRef =
    useRef<number[] | null>(null);
  
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
      ? calculateScore(winners[0].hand)
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
  
  const router = useRouter();

  const setDoubleUpData =
    useDoubleUpStore(
      state => state.setDoubleUpData
    );

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
    
    const values =
      currentPlayer.dice.map(die =>
        die.held
          ? die.value
          : Math.floor(Math.random() * 6) + 1
      );

    const rollingValues =
      currentPlayer.dice.flatMap((die, index) =>
        die.held
          ? []
          : [values[index]]
      );

    pendingRollValuesRef.current =
      values;

    setShowRollOverlay(true);
    setOverlayValues(rollingValues);
  };

  const completeRoll = useCallback(() => {
    const values =
      pendingRollValuesRef.current;

    setShowRollOverlay(false);

    if (values) {
      dispatch({
        type: "ROLL_DICE",
        payload: {
          values,
        },
      });
    }

    dispatch({
      type: "SET_ANIMATION_STATE",
      payload: {
        state: "WAITING_NEXT",
      },
    });

    pendingRollValuesRef.current = null;
  }, [dispatch]);

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
    <div className="p-4 space-y-4">
      <div>
        Phase: {state.phase}
      </div>

      {state.phase === "RESULT" && (
        <div className="space-y-2">

          {results.map(result => (

            <div
              key={result.playerIndex}
              className="border p-2 rounded"
            >
              <div>
                Player:
                {" "}
                {result.playerIndex + 1}
              </div>

              <div>
                Hand:
                {" "}
                {result.hand}
              </div>

              <div>
                Strength:
                {" "}
                {HAND_STRENGTH[result.hand]}
              </div>

              <div>
                Score:
                {" "}
                {calculateScore(result.hand)}
              </div>
            </div>

          ))}

          <div className="space-y-2">

            <div className="border p-2 rounded">
              <div>
                {isTie ? "Tie" : "Winners"}
              </div>

              {(isTie ? results : winners).map(winner => (
                <div key={winner.playerIndex}>
                  Player
                  {" "}
                  {winner.playerIndex + 1}
                </div>
              ))}
            </div>

            <div className="border p-2 rounded">
              <div>
                Losers
              </div>

              {(isTie ? [] : losers).map(loser => (
                <div key={loser.playerIndex}>
                  Player
                  {" "}
                  {loser.playerIndex + 1}
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      <div className="flex gap-2">

        <button
          className="border px-4 py-2 rounded"
          disabled={!canStartDoubleUp}
          onClick={() => {
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
          }}
        >
          Double Up
        </button>

        <button
          className="border px-4 py-2 rounded"
        >
          Finish
        </button>

      </div>

      <div>
        Player:
        {" "}
        {currentPlayer.name}
      </div>

      <div className="flex gap-2">
        {currentPlayer.dice.map((die, index) => (

          <Dice
            key={die.id}

            value={die.value}

            held={die.held}

          disabled={!canHold || isAnimationLocked || isWaitingNext}

            onClick={() => {
              if (!canHold || isAnimationLocked || isWaitingNext) {
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

      <div className="flex gap-2">
        <button
          disabled={!canRoll || isAnimationLocked || isWaitingNext}

          className={`
            border px-4 py-2 rounded

            ${
              !canRoll || isAnimationLocked || isWaitingNext
                ? "opacity-50"
                : ""
            }
          `}

          onClick={handleRoll}
        >
          Roll
        </button>

        <button
          className="border px-4 py-2 rounded"
          disabled={isAnimationLocked}
          onClick={handleNext}
        >
          Next
        </button>
      </div>

      {isRound3Confirm && (
        <div className="flex gap-2">

          <button
            className="border px-4 py-2 rounded"
            disabled={isAnimationLocked || isWaitingNext}
            onClick={() => {
              if (isAnimationLocked || isWaitingNext) {
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
            Roll
          </button>

          <button
            className="border px-4 py-2 rounded"
            disabled={isAnimationLocked || isWaitingNext}
            onClick={() => {
              if (isAnimationLocked || isWaitingNext) {
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

      <DiceRollOverlay

        open={showRollOverlay}

        values={overlayValues}

        onComplete={completeRoll}
      />

    </div>
  );
};
