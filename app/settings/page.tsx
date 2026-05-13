"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import { calculateScore } from "@/features/game/utils/calculateScore";
import { MULTIPLIERS } from "@/features/game/constants/multipliers";
import { HandRank } from "@/features/game/types/hand";

type DialogMode = "players" | null;

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

const SCORE_PREVIEW_HANDS: HandRank[] = [
  "PINSORO",
  "FIVE_DICE",
  "FOUR_DICE",
  "STRAIGHT",
  "FULL_HOUSE",
  "THREE_DICE",
  "TWO_PAIR",
  "ONE_PAIR",
  "BUTA",
];

const normalizePlayers = (
  players: string[]
) => players.map(player => player.trim());

const validatePlayers = (
  players: string[]
) => {
  const trimmed =
    normalizePlayers(players).filter(Boolean);

  if (trimmed.length < MIN_PLAYERS) {
    throw new Error(
      "プレイヤーは2名以上入力してください。"
    );
  }

  if (new Set(trimmed).size !== trimmed.length) {
    throw new Error(
      "同じ名前のプレイヤーがいます。"
    );
  }

  return trimmed;
};

export default function SettingsPage() {
  const router = useRouter();

  const [
    players,
    setPlayers,
  ] = useState<string[]>(["", ""]);

  const [
    backupPlayers,
    setBackupPlayers,
  ] = useState<string[]>([]);

  const [
    playerCount,
    setPlayerCount,
  ] = useState(MIN_PLAYERS);

  const [
    dialogMode,
    setDialogMode,
  ] = useState<DialogMode>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  const [
    twoPairRate,
    setTwoPairRate,
  ] = useState("");

  const numericTwoPairRate =
    Number(twoPairRate);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const playersParam =
      params.get("players");

    if (!playersParam) {
      return;
    }

    try {
      const parsed =
        JSON.parse(playersParam) as unknown;

      if (
        Array.isArray(parsed) &&
        parsed.every(
          player => typeof player === "string"
        )
      ) {
        const nextPlayers =
          parsed.map(player => player.trim());

        const id =
          setTimeout(() => {
            setPlayers(nextPlayers);
            setPlayerCount(
              Math.max(
                nextPlayers.length,
                MIN_PLAYERS
              )
            );
          }, 0);

        return () => {
          clearTimeout(id);
        };
      }
    } catch {
      // Invalid query params should leave settings blank.
    }
  }, []);

  const changePlayerCount = (
    count: number
  ) => {
    setPlayerCount(count);

    setPlayers(prev => {
      const next = [...prev];

      while (next.length < count) {
        next.push("");
      }

      return next.slice(0, count);
    });
  };

  const openPlayerDialog = () => {
    setBackupPlayers(players);
    setPlayerCount(
      Math.max(players.length, MIN_PLAYERS)
    );
    setDialogMode("players");
  };

  const removePlayer = (index: number) => {
    const next =
      players.filter((_, i) => i !== index);

    setPlayers(next);
    setPlayerCount(
      Math.max(next.length, MIN_PLAYERS)
    );
  };

  const confirmPlayers = () => {
    try {
      const validated =
        validatePlayers(players);

      setPlayers(validated);
      setPlayerCount(validated.length);
      setDialogMode(null);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    }
  };

  const startGame = () => {
    try {
      const validated =
        validatePlayers(players);

      if (
        twoPairRate === "" ||
        !/^\d+$/.test(twoPairRate) ||
        Number(twoPairRate) <= 0
      ) {
        throw new Error(
          "レートは1以上の整数で入力してください。"
        );
      }

      router.push(
        `/game?players=${encodeURIComponent(
          JSON.stringify(validated)
        )}&twoPairRate=${twoPairRate}`
      );
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    }
  };

  return (
    <main
      className="
        min-h-screen
        bg-zinc-950
        text-zinc-100
        px-4 py-3
      "
    >
      <div
        className="
          mx-auto
          flex min-h-[calc(100vh-24px)]
          max-w-xl flex-col
          gap-3
        "
      >
        <header className="shrink-0">
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-widest
              text-red-400
            "
          >
            Dice Poker
          </p>

          <h1
            className="
              text-3xl
              font-bold
              text-white
            "
          >
            Settings
          </h1>
        </header>

        <section
          className="
            rounded
            border border-zinc-800
            bg-zinc-900
            p-3
            shadow-xl
          "
        >
          <div
            className="
              flex items-center
              justify-between gap-3
            "
          >
            <div>
              <h2
                className="
                  text-base
                  font-semibold
                  text-white
                "
              >
                Players
              </h2>
              <p className="text-xs text-zinc-400">
                2名以上、重複なし
              </p>
            </div>

            <button
              type="button"
              onClick={openPlayerDialog}
              className="
                rounded
                bg-red-600
                px-4 py-2
                text-sm
                font-bold
                text-white
                transition
                hover:bg-red-500
              "
            >
              Edit
            </button>
          </div>

          <div
            className="
              mt-2
              flex flex-wrap gap-2
            "
          >
            {normalizePlayers(players).filter(Boolean).length === 0 ? (
              <span className="text-sm text-zinc-500">
                No players
              </span>
            ) : (
              normalizePlayers(players)
                .filter(Boolean)
                .map((player, index) => (
                  <div
                    key={`${player}-${index}`}
                    className="
                      flex items-center gap-2
                      rounded
                      border border-zinc-700
                      bg-zinc-950
                      px-3 py-2
                      text-sm
                    "
                  >
                    <span
                      className="
                        text-xs
                        font-bold
                        text-red-400
                      "
                    >
                      P{index + 1}
                    </span>
                    <span className="font-semibold">
                      {player}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="
                        text-zinc-500
                        transition
                        hover:text-red-300
                      "
                      aria-label={`${player}を削除`}
                    >
                      x
                    </button>
                  </div>
                ))
            )}
          </div>
        </section>

        <section
          className="
            rounded
            border border-zinc-800
            bg-zinc-900
            p-3
            shadow-xl
          "
        >
          <div
            className="
              flex items-end
              justify-between gap-3
            "
          >
            <div>
              <h2
                className="
                  text-base
                  font-semibold
                  text-white
                "
              >
                Rate
              </h2>
              <p className="text-xs text-zinc-400">
                2ペア基準
              </p>
            </div>

            <label
              className="
                flex min-w-40
                flex-col gap-1
              "
            >
              <span
                className="
                  text-xs
                  font-semibold
                  text-zinc-300
                "
              >
                Two Pair
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={twoPairRate}
                onChange={event => {
                  const value =
                    event.target.value;

                  if (/^\d*$/.test(value)) {
                    setTwoPairRate(value);
                  }
                }}
                className="
                  w-full
                  min-w-40
                  rounded
                  border border-zinc-700
                  bg-zinc-950
                  px-3 py-2
                  text-right
                  text-xl
                  font-bold
                  text-white
                  outline-none
                  transition
                  placeholder:text-zinc-600
                  focus:border-red-500
                "
                placeholder="Rate"
              />
            </label>
          </div>

          <div
            className="
              mt-2
              flex gap-2
              overflow-x-auto
              pb-1
            "
          >
            {SCORE_PREVIEW_HANDS.map(hand => (
              <div
                key={hand}
                className="
                  min-w-24
                  rounded
                  border border-zinc-800
                  bg-zinc-950
                  p-2
                "
              >
                <div
                  className="
                    text-[10px]
                    font-bold
                    text-zinc-500
                  "
                >
                  {hand}
                </div>
                <div
                  className="
                    mt-1
                    text-base
                    font-bold
                    text-red-300
                  "
                >
                  {twoPairRate &&
                  numericTwoPairRate > 0
                    ? calculateScore(
                        hand,
                        numericTwoPairRate
                      )
                    : "-"}
                </div>
                <div className="text-[10px] text-zinc-600">
                  x{MULTIPLIERS[hand]}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className="
            rounded
            border border-zinc-800
            bg-zinc-900
            p-3
          "
        >
          <div
            className="
              flex items-center
              justify-between gap-3
            "
          >
            <div>
              <h2
                className="
                  text-base
                  font-semibold
                  text-white
                "
              >
                Game Start
              </h2>
              <p className="text-xs text-zinc-400">
                入力内容を確認して開始
              </p>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="
                rounded
                bg-red-600
                px-6 py-3
                text-base
                font-bold
                text-white
                transition
                hover:bg-red-500
              "
            >
              Start
            </button>
          </div>
        </section>
      </div>

      {dialogMode === "players" && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/70
            px-4
          "
        >
          <div
            className="
              w-full
              max-w-md
              rounded-lg
              border border-zinc-700
              bg-zinc-900
              p-4
              shadow-2xl
            "
          >
            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              Edit Players
            </h2>

            <label
              className="
                mt-4 block
                text-sm font-semibold
                text-zinc-300
              "
            >
              Player Count
            </label>

            <select
              value={playerCount}
              onChange={event =>
                changePlayerCount(
                  Number(event.target.value)
                )
              }
              className="
                mt-2
                w-full
                rounded
                border border-zinc-700
                bg-zinc-950
                px-3 py-3
                text-white
              "
            >
              {Array.from(
                { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
                (_, index) => index + MIN_PLAYERS
              ).map(count => (
                <option
                  key={count}
                  value={count}
                >
                  {count} Players
                </option>
              ))}
            </select>

            <div className="mt-4 space-y-2">
              {players.map((player, index) => (
                <input
                  key={index}
                  type="text"
                  value={player}
                  placeholder={`Player ${index + 1}`}
                  onChange={event => {
                    const next = [...players];
                    next[index] = event.target.value;
                    setPlayers(next);
                  }}
                  className="
                    w-full
                    rounded
                    border border-zinc-700
                    bg-zinc-950
                    px-3 py-3
                    text-white
                    outline-none
                    transition
                    placeholder:text-zinc-600
                    focus:border-red-500
                  "
                />
              ))}
            </div>

            <div
              className="
                mt-5
                flex justify-end gap-3
              "
            >
              <button
                type="button"
                onClick={() => {
                  setPlayers(backupPlayers);
                  setPlayerCount(
                    Math.max(
                      backupPlayers.length,
                      MIN_PLAYERS
                    )
                  );
                  setDialogMode(null);
                }}
                className="
                  rounded
                  border border-zinc-700
                  px-4 py-3
                  font-semibold
                  text-zinc-200
                  transition
                  hover:bg-zinc-800
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmPlayers}
                className="
                  rounded
                  bg-red-600
                  px-5 py-3
                  font-bold
                  text-white
                  transition
                  hover:bg-red-500
                "
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/70
            px-4
          "
        >
          <div
            className="
              w-full
              max-w-sm
              rounded-lg
              border border-red-800
              bg-zinc-900
              p-5
              text-center
              shadow-2xl
            "
          >
            <h2
              className="
                text-xl
                font-bold
                text-red-300
              "
            >
              Error
            </h2>
            <p className="mt-3 text-zinc-200">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="
                mt-5
                rounded
                bg-red-600
                px-5 py-3
                font-bold
                text-white
                transition
                hover:bg-red-500
              "
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
