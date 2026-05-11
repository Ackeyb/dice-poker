import { judgeHand } from "./judgeHand";
import { PlayerResult } from "../types/result";

import { GamePlayer } from "../types/player";

export const getPlayerResults = (
  players: GamePlayer[]
): PlayerResult[] => {

  return players.map(
    (player, index) => {

      const values = player.dice.map(
        die => die.value
      );

      return {
        playerIndex: index,
        hand: judgeHand(values),
      };
    }
  );
};