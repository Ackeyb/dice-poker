"use client";

import {
  useEffect,
  useRef,
} from "react";

import type DiceBox from "@3d-dice/dice-box";

type Props = {

  values: number[];

  onRollComplete?: (values: number[]) => void;

  scale?: number;

  className?: string;

  elementId?: string;
};

export const Dice3D = ({
  values,
  onRollComplete,
  scale = 5,
  className = "",
  elementId = "dice-box",
}: Props) => {

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const diceBoxRef =
    useRef<DiceBox | null>(null);

  useEffect(() => {
    let active = true;

    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    const diceValues =
      values.slice(0, 5);

    const init = async () => {

      container.innerHTML = "";

      const diceBoxModule =
        await import(
          "@3d-dice/dice-box"
        );

      if (!active) {
        return;
      }

      const DiceBox =
        diceBoxModule.default;

      const box =
        new DiceBox(
          `#${elementId}`,
          {
            assetPath:
              "/assets/dice-box/",
            gravity: 1,
            throwForce: 4,
            spinForce: 3,
            scale,
          }
        );

      diceBoxRef.current = box;

      await box.init();

      if (!active) {
        return;
      }

      await box.clear?.();

      const results =
        diceValues.length > 0
          ? await box.roll({
              sides: 6,
              qty: diceValues.length,
            })
          : [];

      if (active) {
        onRollComplete?.(
          results.map(result => result.value)
        );
      }
    };

    init();

    return () => {
      active = false;

      const box = diceBoxRef.current;

      box?.clear?.();

      container.innerHTML = "";

      diceBoxRef.current = null;
    };
  }, [elementId, onRollComplete, scale, values]);

  return (

    <div
      id={elementId}
      ref={containerRef}

      className={`
        w-full
        h-[300px]

        ${className}
      `}
    />

  );
};
