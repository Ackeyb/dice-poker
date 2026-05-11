import { HAND_RANK } from "../constants/handRank";
import { PlayerState } from "../types/game";

export const determineWinners = (
  players: PlayerState[]
) => {
  const maxRank = Math.max(
    ...players.map(player => HAND_RANK[player.hand!])
  );

  return players.filter(
    player => HAND_RANK[player.hand!] === maxRank
  );
};