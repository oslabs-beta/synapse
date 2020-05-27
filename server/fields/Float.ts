/* eslint-disable class-methods-use-this */

export {};

const { Number } = require("./Number");

class Float extends Number {
  /**
   * Converts the input value to a floating point number.
   * @param value The user's input.
   * @returns A floating point number.
   */
  async parse(value: any) {
    return parseFloat(value);
  }
}

module.exports = Float;
