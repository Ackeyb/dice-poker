import { PokerHand } from "../types/hand";
import { countDice } from "../utils/countDice";

const isStraight = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);

  const pattern1 = [1, 2, 3, 4, 5];
  const pattern2 = [2, 3, 4, 5, 6];

  return (
    JSON.stringify(sorted) === JSON.stringify(pattern1) ||
    JSON.stringify(sorted) === JSON.stringify(pattern2)
  );
};

export const judgePokerHand = (
  values: number[]
): PokerHand => {
  const counts = countDice(values);

  const grouped = [...counts.values()].sort((a, b) => b - a);

  // ピンゾロ
  if (grouped[0] === 5 && values.every(v => v === 1)) {
    return "PINSORO";
  }

  // 5ダイス
  if (grouped[0] === 5) {
    return "FIVE_DICE";
  }

  // 4ダイス
  if (grouped[0] === 4) {
    return "FOUR_DICE";
  }

  // ストレート
  if (isStraight(values)) {
    return "STRAIGHT";
  }

  // フルハウス
  if (grouped[0] === 3 && grouped[1] === 2) {
    return "FULL_HOUSE";
  }

  // 3ダイス
  if (grouped[0] === 3) {
    return "THREE_DICE";
  }

  // 2ペア
  if (grouped[0] === 2 && grouped[1] === 2) {
    return "TWO_PAIR";
  }

  // 1ペア
  if (grouped[0] === 2) {
    return "ONE_PAIR";
  }

  // ブタ
  return "PIG";
};