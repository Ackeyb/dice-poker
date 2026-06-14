"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import { calculateScore } from "@/features/game/utils/calculateScore";
import { MULTIPLIERS } from "@/features/game/constants/multipliers";
import { HAND_LABELS } from "@/features/game/constants/handLabels";
import { HandRank } from "@/features/game/types/hand";

type DialogMode = "players" | null;

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const MAX_PLAYER_NAME_LENGTH = 6;

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

const limitPlayerName = (
  player: string
) =>
  Array.from(player)
    .slice(0, MAX_PLAYER_NAME_LENGTH)
    .join("");

const createBlankPlayers = () =>
  Array.from({ length: MIN_PLAYERS }, () => "");

const ensureEditablePlayers = (
  players: string[]
) => {
  const next = [...players];

  while (next.length < MIN_PLAYERS) {
    next.push("");
  }

  return next;
};

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

  if (
    trimmed.some(
      player =>
        Array.from(player).length >
        MAX_PLAYER_NAME_LENGTH
    )
  ) {
    throw new Error(
      "Player名は6文字以内で入力してください。"
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
  ] = useState<string[]>(createBlankPlayers);

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
    onePairRate,
    setOnePairRate,
  ] = useState("");

  const numericOnePairRate =
    Number(onePairRate);

  useEffect(() => {
    const navigationEntry =
      performance.getEntriesByType(
        "navigation"
      )[0] as
        | PerformanceNavigationTiming
        | undefined;

    if (navigationEntry?.type === "reload") {
      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );
      return;
    }

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
          parsed.map(player =>
            limitPlayerName(player.trim())
          );

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
    const editablePlayers =
      ensureEditablePlayers(players);

    setBackupPlayers(players);
    setPlayers(editablePlayers);
    setPlayerCount(editablePlayers.length);
    setDialogMode("players");
  };

  const resetPlayers = () => {
    setPlayers(createBlankPlayers());
    setBackupPlayers([]);
    setPlayerCount(MIN_PLAYERS);
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
        onePairRate === "" ||
        !/^\d+$/.test(onePairRate) ||
        Number(onePairRate) <= 0
      ) {
        throw new Error(
          "レートは1以上の整数で入力してください。"
        );
      }

      router.push(
        `/game?players=${encodeURIComponent(
          JSON.stringify(validated)
        )}&onePairRate=${onePairRate}`
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
        h-screen
        overflow-hidden
        bg-zinc-950
        text-zinc-100
        px-3 py-2
      "
    >
      <div
        className="
          mx-auto
          flex h-full
          max-w-xl flex-col
          gap-2
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
              text-2xl
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
            p-2.5
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

            <div
              className="
                flex shrink-0
                items-center gap-2
              "
            >
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

              <button
                type="button"
                onClick={resetPlayers}
                className="
                  rounded
                  border border-zinc-700
                  bg-zinc-950
                  px-3 py-2
                  text-sm
                  font-bold
                  text-zinc-100
                  transition
                  hover:border-red-500
                  hover:text-red-200
                "
              >
                Reset
              </button>
            </div>
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
                .map((player, index) => ({
                  player,
                  index,
                }))
                .filter(({ player }) => Boolean(player))
                .map(({ player, index }) => (
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
            p-2.5
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
                1 Pair base
              </p>
            </div>

            <label
              className="
                flex min-w-36
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
                One Pair
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={onePairRate}
                onChange={event => {
                  const value =
                    event.target.value;

                  if (/^\d*$/.test(value)) {
                    setOnePairRate(value);
                  }
                }}
                className="
                  w-full
                  min-w-36
                  rounded
                  border border-zinc-700
                  bg-zinc-950
                  px-3 py-1.5
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
              grid gap-1
            "
          >
            {SCORE_PREVIEW_HANDS.map(hand => (
              <div
                key={hand}
                className="
                  flex items-center
                  justify-between gap-3
                  rounded
                  border border-zinc-800
                  bg-zinc-950
                  px-2 py-1
                "
              >
                <div className="min-w-0">
                  <div
                    className="
                      truncate
                      text-[11px]
                      font-bold
                      text-zinc-300
                    "
                  >
                    {HAND_LABELS[hand]}
                  </div>
                  <div className="text-[10px] text-zinc-600">
                    x{MULTIPLIERS[hand]}
                  </div>
                </div>
                <div
                  className="
                    shrink-0
                    text-sm
                    font-bold
                    text-red-300
                  "
                >
                  {onePairRate &&
                  numericOnePairRate > 0
                    ? calculateScore(
                        hand,
                        numericOnePairRate
                      )
                    : "-"}
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
            shrink-0
            p-2.5
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
                px-6 py-2.5
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
                  maxLength={MAX_PLAYER_NAME_LENGTH}
                  value={player}
                  placeholder={`Player ${index + 1}`}
                  onChange={event => {
                    const next = [...players];
                    next[index] = limitPlayerName(
                      event.target.value
                    );
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
