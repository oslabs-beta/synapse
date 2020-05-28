/* eslint-disable class-methods-use-this */

export {};

const Number = require("./Number");

class Integer extends Number {
  /**
   * Takes any number and parses it to be an integer.
   * @param value The user's input.
   * @returns The inputted value parsed to be an integer.
   */
  async parse(value: any) {
    return parseInt(value, 10);
  }
}

module.exports = Integer;
