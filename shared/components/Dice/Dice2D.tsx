type Props = {

  value: number;

  held?: boolean;

  disabled?: boolean;

  onClick?: () => void;

  className?: string;
};

export const Dice = ({
  value,
  held = false,
  disabled = false,
  onClick,
  className = "",
}: Props) => {

  return (

    <button
      disabled={
        disabled
          ? true
          : undefined
      }      onClick={onClick}

      className={`
        relative

        w-16 h-16

        border rounded-xl

        flex items-center justify-center

        text-2xl font-bold

        transition-all

        ${
          held
            ? "bg-yellow-300 scale-95"
            : "bg-white"
        }

        ${
          disabled
            ? "opacity-50"
            : ""
        }

        ${className}
      `}
    >

      <div>
        {value}
      </div>

      {held && (
        <div
          className="
            absolute
            -bottom-2

            text-xs

            bg-black
            text-white

            px-2 py-1

            rounded
          "
        >
          HOLD
        </div>
      )}

    </button>
  );
};
