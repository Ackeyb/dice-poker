"use client";

import {
  useEffect,
  useRef,
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

  const previousRoundRef =
    useRef<number | null>(null);

  useEffect(() => {
    if (!roundNumber) {
      return;
    }

    const isRoundChanged =
      previousRoundRef.current !==
      roundNumber;

    previousRoundRef.current =
      roundNumber;

    const timers:
      ReturnType<typeof setTimeout>[] = [];

    if (isRoundChanged) {
      timers.push(
        setTimeout(() => {
          setStep("ROUND");
        }, 0)
      );

      timers.push(
        setTimeout(() => {
          setStep("PLAYER");
        }, 1150)
      );

      timers.push(
        setTimeout(() => {
          setStep(null);
        }, 2450)
      );
    } else {
      timers.push(
        setTimeout(() => {
          setStep("PLAYER");
        }, 0)
      );

      timers.push(
        setTimeout(() => {
          setStep(null);
        }, 1300)
      );
    }

    return () => {
      timers.forEach(timer => {
        clearTimeout(timer);
      });
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
