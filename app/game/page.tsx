"use client";

import { GameScreen } from "@/features/game/components/GameScreen";
import {
  Suspense,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";

function GamePageInner() {
  const searchParams = useSearchParams();

  const playerNames = useMemo(() => {
    const playersParam =
      searchParams.get("players");

    if (!playersParam) {
      return undefined;
    }

    try {
      const parsed =
        JSON.parse(playersParam) as unknown;

      if (
        Array.isArray(parsed) &&
        parsed.every(
          player => typeof player === "string"
        ) &&
        parsed.length >= 2
      ) {
        return parsed;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }, [searchParams]);

  const twoPairRate = useMemo(() => {
    const rateParam =
      searchParams.get("twoPairRate");

    if (!rateParam || !/^\d+$/.test(rateParam)) {
      return undefined;
    }

    const rate = Number(rateParam);

    return rate > 0
      ? rate
      : undefined;
  }, [searchParams]);

  return (
    <GameScreen
      playerNames={playerNames}
      twoPairRate={twoPairRate}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <GamePageInner />
    </Suspense>
  );
}
