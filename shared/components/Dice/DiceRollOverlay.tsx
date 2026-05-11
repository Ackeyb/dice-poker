"use client";

import {
  Dice3D,
} from "./Dice3D";

type Props = {

  open: boolean;

  values: number[];

  onComplete: () => void;
};

export const DiceRollOverlay = ({
  open,
  values,
  onComplete,
}: Props) => {

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
        className="
          w-full
          max-w-xl
        "
      >

        <Dice3D
          values={values}
          onRollComplete={() => {

            setTimeout(() => {
              onComplete();
            }, 1500);

          }}
        />

      </div>

    </div>
  );
};