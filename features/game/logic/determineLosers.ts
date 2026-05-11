import { HAND_RANK } from "../constants/handRank";
import { PlayerState } from "../types/game";

export const determineLosers = (
  players: PlayerState[]
) => {
  const minRank = Math.min(
    ...players.map(player => HAND_RANK[player.hand!])
  );

  return players.filter(
    player => HAND_RANK[player.hand!] === minRank
  );
};