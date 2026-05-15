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
  onComplete?: (
    triggerKey: string
  ) => void;
};

export const TurnCutIn = ({
  roundNumber,
  playerName,
  triggerKey,
  onComplete,
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

    const timers:
      ReturnType<typeof setTimeout>[] = [];

    if (isRoundChanged) {
      timers.push(
        setTimeout(() => {
          previousRoundRef.current =
            roundNumber;

          setStep("ROUND");
        }, 0)
      );

      timers.push(
        setTimeout(() => {
          setStep(null);
        }, 1875)
      );

      timers.push(
        setTimeout(() => {
          setStep("PLAYER");
        }, 2175)
      );

      timers.push(
        setTimeout(() => {
          setStep(null);
          onComplete?.(triggerKey);
        }, 4125)
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
          onComplete?.(triggerKey);
        }, 1950)
      );
    }

    return () => {
      timers.forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, [onComplete, roundNumber, triggerKey]);

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
      role="dialog"
      aria-modal="true"
      aria-label={
        step === "ROUND"
          ? `Round ${roundNumber}`
          : `${playerName} turn`
      }
      className="
        pointer-events-auto
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
