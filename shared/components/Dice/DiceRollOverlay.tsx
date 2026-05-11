"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  Dice3D,
} from "./Dice3D";

type Props = {

  open: boolean;

  values: number[];

  onComplete: () => void;

  diceScale?: number;

  diceClassName?: string;

  panelClassName?: string;
};

export const DiceRollOverlay = ({
  open,
  values,
  onComplete,
  diceScale,
  diceClassName = "",
  panelClassName = "",
}: Props) => {

  const completeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  useEffect(() => {
    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  const handleRollComplete = useCallback(() => {
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
    }

    completeTimerRef.current =
      setTimeout(() => {
        onComplete();
      }, 1500);
  }, [onComplete]);

  if (!open) {
    return null;
  }

  return (

    <div
      className="
        fixed inset-0

        bg-black/70

        z-50

        flex
        items-center
        justify-center
      "
    >

      <div
        className={`
          w-full
          max-w-xl

          ${panelClassName}
        `}
      >

        <Dice3D
          values={values}
          onRollComplete={handleRollComplete}
          scale={diceScale}
          className={diceClassName}
        />

      </div>

    </div>
  );
};
