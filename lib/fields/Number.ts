/* eslint-disable import/extensions */
/* eslint-disable no-bitwise */

import Field from "../state/Field";

export default class Number extends Field {
  min: number;

  max: number;

  constructor(
    min: number = undefined,
    max: number = undefined,
    defaultVal: number = undefined,
    flags: number = null
  ) {
    super(defaultVal, flags);

    this.min = min;
    this.max = max;
  }

  /**
   * Determines if its input is of the right type and conforms to the rules set by the developer.
   * @param value The user's input.
   * @returns Undefined if the input is not a number or below/above the min/max character count, or the input itself if it is in the correct format and passes all tests.
   */
  async parse(value: any) {
    const number = typeof value === "number" ? value : <any>super.parse(value) - 0;

    if (typeof value !== "number" || this.min < number || number > this.max) {
      return undefined;
    }

    return number;
  }
}
