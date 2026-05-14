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

const TARGET_FRAME_MS =
  1000 / 30;

let frameLimitUsers = 0;
let originalRequestAnimationFrame:
  typeof window.requestAnimationFrame | null =
    null;
let originalCancelAnimationFrame:
  typeof window.cancelAnimationFrame | null =
    null;

const enableFrameRateLimit = () => {
  if (typeof window === "undefined") {
    return;
  }

  frameLimitUsers += 1;

  if (originalRequestAnimationFrame) {
    return;
  }

  originalRequestAnimationFrame =
    window.requestAnimationFrame.bind(window);
  originalCancelAnimationFrame =
    window.cancelAnimationFrame.bind(window);

  window.requestAnimationFrame = callback => {
    return window.setTimeout(() => {
      const frameTime =
        performance.now();

      callback(frameTime);
    }, TARGET_FRAME_MS);
  };

  window.cancelAnimationFrame = handle => {
    window.clearTimeout(handle);
  };
};

const disableFrameRateLimit = () => {
  if (typeof window === "undefined") {
    return;
  }

  frameLimitUsers =
    Math.max(0, frameLimitUsers - 1);

  if (
    frameLimitUsers > 0 ||
    !originalRequestAnimationFrame
  ) {
    return;
  }

  window.requestAnimationFrame =
    originalRequestAnimationFrame;
  window.cancelAnimationFrame =
    originalCancelAnimationFrame ??
    window.cancelAnimationFrame;
  originalRequestAnimationFrame = null;
  originalCancelAnimationFrame = null;
};

export const Dice3D = ({
  values,
  onRollComplete,
  scale = 5,
  className = "h-[300px]",
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
    enableFrameRateLimit();

    const container =
      containerRef.current;

    if (!container) {
      disableFrameRateLimit();

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
      disableFrameRateLimit();
    };
  }, [elementId, onRollComplete, scale, values]);

  return (

    <div
      id={elementId}
      ref={containerRef}

      className={`
        w-full

        ${className}
      `}
    />

  );
};
