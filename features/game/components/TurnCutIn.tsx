"use client";

import {
  useEffect,
  useState,
} from "react";

type CutInStep =
  | "ROUND"
  | "PLAYER"
  | null;

type Props = {
  roundNumber: number | null;
  playerName: string;
  triggerKey: string;
};

export const TurnCutIn = ({
  roundNumber,
  playerName,
  triggerKey,
}: Props) => {
  const [
    step,
    setStep,
  ] = useState<CutInStep>(null);

  useEffect(() => {
    if (!roundNumber) {
      return;
    }

    const startId =
      setTimeout(() => {
        setStep("ROUND");
      }, 0);

    const playerId =
      setTimeout(() => {
        setStep("PLAYER");
      }, 1150);

    const endId =
      setTimeout(() => {
        setStep(null);
      }, 2450);

    return () => {
      clearTimeout(startId);
      clearTimeout(playerId);
      clearTimeout(endId);
    };
  }, [roundNumber, triggerKey]);

  if (!step || !roundNumber) {
    return null;
  }

  const title =
    step === "ROUND"
      ? `Round ${roundNumber}`
      : `${playerName}のターン`;

  const subtitle =
    step === "ROUND"
      ? "Get Ready"
      : "Roll the Dice";

  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        fixed inset-0 z-[60]
        flex items-center justify-center
        overflow-hidden
      "
    >
      <div className="cutin-backdrop" />
      <div className="cutin-blade cutin-blade-top" />
      <div className="cutin-blade cutin-blade-bottom" />
      <div className="cutin-flash" />

      <div className="cutin-content">
        <div className="cutin-subtitle">
          {subtitle}
        </div>
        <div className="cutin-title">
          {title}
        </div>
      </div>
    </div>
  );
};
