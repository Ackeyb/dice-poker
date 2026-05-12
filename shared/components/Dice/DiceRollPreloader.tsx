"use client";

import {
  useState,
} from "react";

import {
  Dice3D,
} from "./Dice3D";

type Props = {
  scale?: number;
};

export const DiceRollPreloader = ({
  scale = 5,
}: Props) => {
  const [
    ready,
    setReady,
  ] = useState(false);

  if (ready) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        fixed
        -left-[1400px]
        top-0
        h-[900px]
        w-[900px]
        overflow-hidden
        opacity-0
      "
    >
      <Dice3D
        elementId="dice-box-preload"
        values={[1]}
        scale={scale}
        className="h-[900px]"
        onRollComplete={() => {
          setReady(true);
        }}
      />
    </div>
  );
};
