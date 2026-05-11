"use client";

import { useGameEngine } from "../hooks/useGameEngine";
import { judgeHand } from "../utils/judgeHand";
import { getPlayerResults }
from "../utils/getPlayerResults";
import { getWinnersAndLosers }
from "../utils/getWinnersAndLosers";
import { HAND_STRENGTH }
from "../constants/handStrength";
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
  useEffect,
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
  
  useEffect(() => {
    setMounted(true);
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
  
  const hand = judgeHand(
    currentPlayer.dice.map(
    die => die.value
    )
  );
  
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
  
  const router = useRouter();

  const setDoubleUpData =
    useDoubleUpStore(
      state => state.setDoubleUpData
    );

  const handleRoll = () => {

    const values = Array.from(
      { length: 5 },
      () => Math.floor(Math.random() * 6) + 1
    );

    setShowRollOverlay(true);
    setOverlayValues(values);

    dispatch({
      type: "ROLL_DICE",
    });

    // Round1
    if (state.phase === "ROUND1_ROLL") {
      dispatch({
        type: "SET_PHASE",
        payload: {
          phase: "ROUND1_HOLD",
        },
      });

      return;
    }

    // Round2
    if (state.phase === "ROUND2_ROLL") {
      dispatch({
        type: "ADVANCE_PHASE",
      });

      return;
    }

    // Round3
    if (state.phase === "ROUND3_HOLD") {

      dispatch({
        type: "SET_PHASE",
        payload: {
          phase: "ROUND3_ROLL",
        },
      });

      dispatch({
        type: "ADVANCE_PHASE",
      });

      return;
    }
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
            </div>

          ))}

          <div className="space-y-2">

            <div className="border p-2 rounded">
              <div>
                Winners
              </div>

              {winners.map(winner => (
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

              {losers.map(loser => (
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
          onClick={() => {

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

              score: 100,
            });

            router.push("/double-up");
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

            disabled={!canHold}

            onClick={() => {
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
          disabled={canRoll ? false : true}

          className={`
            border px-4 py-2 rounded

            ${!canRoll ? "opacity-50" : ""}
          `}

          onClick={handleRoll}
        >
          Roll
        </button>

        <button
          className="border px-4 py-2 rounded"
          onClick={() => {
            dispatch({
              type: "ADVANCE_PHASE",
            });
          }}
        >
          Next
        </button>
      </div>

      {isRound3Confirm && (
        <div className="flex gap-2">

          <button
            className="border px-4 py-2 rounded"
            onClick={() => {
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
            onClick={() => {
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

        onComplete={() => {
          setShowRollOverlay(false);
        }}
      />

    </div>
  );
};