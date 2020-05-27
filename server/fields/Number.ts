/* eslint-disable no-bitwise */

export {};

const { Field } = require("../synapse/Field");

class Number extends Field {
  min: number;

  max: number;

  constructor(
    min: number = null,
    max: number = null,
    defaultVal: number = null,
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

    if (typeof value !== "number" || number < this.min || number > this.max) {
      return undefined;
    }

    return number;
  }
}

module.exports = Number;
