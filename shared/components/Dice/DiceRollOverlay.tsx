"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";

import {
  Dice3D,
} from "./Dice3D";

type Props = {

  open: boolean;

  values: number[];

  onComplete: (values: number[]) => void;

  diceScale?: number;

  diceClassName?: string;

  panelClassName?: string;
};

type DiceRollDieProps = {
  elementId: string;
  value: number;
  index: number;
  scale?: number;
  className: string;
  onComplete: (
    index: number,
    value: number
  ) => void;
};

const getGridClassName = (
  count: number
) => {
  if (count <= 2) {
    return "grid-cols-2";
  }

  if (count === 3) {
    return "grid-cols-3";
  }

  return "grid-cols-3";
};

const getCellClassName = (
  count: number
) => {
  if (count <= 2) {
    return "h-[42vh] max-h-[520px] min-h-[240px]";
  }

  if (count === 3) {
    return "h-[34vh] max-h-[460px] min-h-[220px]";
  }

  return "h-[30vh] max-h-[360px] min-h-[180px]";
};

const DiceRollDie = ({
  elementId,
  value,
  index,
  scale,
  className,
  onComplete,
}: DiceRollDieProps) => {
  const dieValues =
    useMemo(() => [value], [value]);

  const handleComplete =
    useCallback((rolledValues: number[]) => {
      const rolledValue =
        rolledValues[0];

      if (typeof rolledValue === "number") {
        onComplete(index, rolledValue);
      }
    }, [index, onComplete]);

  return (
    <Dice3D
      elementId={elementId}
      values={dieValues}
      onRollComplete={handleComplete}
      scale={scale}
      className={className}
    />
  );
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

  const rollResultsRef =
    useRef<number[]>([]);

  const completedIndexesRef =
    useRef<Set<number>>(new Set());

  const reactId =
    useId();

  const overlayId =
    useMemo(
      () =>
        reactId.replace(
          /[^a-zA-Z0-9_-]/g,
          ""
        ),
      [reactId]
    );

  const rollKey =
    useMemo(
      () =>
        open
          ? `${overlayId}-${values.join("-")}`
          : "closed",
      [open, overlayId, values]
    );

  useEffect(() => {
    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    rollResultsRef.current = [];
    completedIndexesRef.current =
      new Set();

    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, [rollKey, values.length]);

  const handleRollComplete = useCallback((values: number[]) => {
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
    }

    completeTimerRef.current =
      setTimeout(() => {
        onComplete(values);
      }, 1500);
  }, [onComplete]);

  const handleDieComplete =
    useCallback((
      index: number,
      value: number
    ) => {
      if (
        completedIndexesRef.current.has(index)
      ) {
        return;
      }

      completedIndexesRef.current.add(index);
      rollResultsRef.current[index] = value;

      if (
        completedIndexesRef.current.size ===
        values.length
      ) {
        handleRollComplete(
          rollResultsRef.current.slice(
            0,
            values.length
          )
        );
      }
    }, [handleRollComplete, values.length]);

  if (!open) {
    return null;
  }

  const hasMultipleDice =
    values.length > 1;

  const multiDiceClassName =
    getCellClassName(values.length);

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

        {hasMultipleDice ? (
          <div
            className={`
              grid
              ${getGridClassName(values.length)}
              gap-3
              sm:gap-5
            `}
          >
            {values.map((value, index) => (
              <DiceRollDie
                key={`${rollKey}-${index}`}
                elementId={`dice-box-${rollKey}-${index}`}
                value={value}
                index={index}
                scale={diceScale}
                className={multiDiceClassName}
                onComplete={handleDieComplete}
              />
            ))}
          </div>
        ) : (
          <Dice3D
            values={values}
            onRollComplete={handleRollComplete}
            scale={diceScale}
            className={diceClassName}
          />
        )}

      </div>

    </div>
  );
};
