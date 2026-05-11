"use client";

import {
  useEffect,
  useRef,
} from "react";

type Props = {

  values: number[];

  onRollComplete?: () => void;
};

export const Dice3D = ({
  values,
  onRollComplete,
}: Props) => {

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const diceBoxRef =
    useRef<any>(null);

  useEffect(() => {

    if (!containerRef.current) {
      return;
    }

  const init = async () => {

    const module =
      await import(
        "@3d-dice/dice-box"
      );

    const DiceBox =
      module.default;

    const box =
      new DiceBox(
        "#dice-box",
        {
          assetPath:
            "/assets/dice-box/",
        }
      );

    diceBoxRef.current = box;

    await box.init();

    await box.roll(
      values.map(value => ({
        sides: 6,
        value,
      }))
    );

    onRollComplete?.();
  };

  init();
    }, []);

  return (

    <div
      id="dice-box"
      ref={containerRef}

      className="
        w-full
        h-[300px]
      "
    />

  );
};