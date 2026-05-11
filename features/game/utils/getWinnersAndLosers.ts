import { PlayerResult }
from "../types/result";

import { HAND_STRENGTH }
from "../constants/handStrength";

export const getWinnersAndLosers = (
  results: PlayerResult[]
) => {

  const strengths = results.map(
    result =>
      HAND_STRENGTH[result.hand]
  );

  const maxStrength =
    Math.max(...strengths);

  const minStrength =
    Math.min(...strengths);

  const winners = results.filter(
    result =>
      HAND_STRENGTH[result.hand] ===
      maxStrength
  );

  const losers = results.filter(
    result =>
      HAND_STRENGTH[result.hand] ===
      minStrength
  );

  return {
    winners,
    losers,
  };
};