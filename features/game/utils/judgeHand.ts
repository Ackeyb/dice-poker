import { HandRank } from "../types/hand";

export const judgeHand = (
  values: number[]
): HandRank => {

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const counts = new Map<number, number>();

  for (const value of values) {
    counts.set(
      value,
      (counts.get(value) ?? 0) + 1
    );
  }

  const countValues = Array.from(
    counts.values()
  ).sort((a, b) => b - a);

  // ピンゾロ
  if (
    countValues[0] === 5 &&
    sorted[0] === 1
  ) {
    return "PINSORO";
  }

  // 5ダイス
  if (countValues[0] === 5) {
    return "FIVE_DICE";
  }

  // 4ダイス
  if (countValues[0] === 4) {
    return "FOUR_DICE";
  }

  // ストレート
  const isStraight =
    sorted.join(",") === "1,2,3,4,5" ||
    sorted.join(",") === "2,3,4,5,6";

  if (isStraight) {
    return "STRAIGHT";
  }

  // フルハウス
  if (
    countValues[0] === 3 &&
    countValues[1] === 2
  ) {
    return "FULL_HOUSE";
  }

  // 3ダイス
  if (countValues[0] === 3) {
    return "THREE_DICE";
  }

  // 2ペア
  if (
    countValues[0] === 2 &&
    countValues[1] === 2
  ) {
    return "TWO_PAIR";
  }

  // 1ペア
  if (countValues[0] === 2) {
    return "ONE_PAIR";
  }

  return "BUTA";
};