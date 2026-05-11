declare module "@3d-dice/dice-box" {
  type DiceBoxRollDie = {
    sides: number;
    qty?: number;
  };

  type DiceBoxRollResult = {
    sides: number;
    value: number;
  };

  type DiceBoxOptions = {
    assetPath: string;
    gravity?: number;
    throwForce?: number;
    spinForce?: number;
    scale?: number;
  };

  export default class DiceBox {
    constructor(selector: string, options: DiceBoxOptions);

    init(): Promise<void>;

    roll(
      dice: DiceBoxRollDie[] | DiceBoxRollDie | string
    ): Promise<DiceBoxRollResult[]>;

    clear?(): Promise<void> | void;
  }
}
