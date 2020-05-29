/* eslint-disable class-methods-use-this */

export {};

const Number = require("./Number");

class Float extends Number {
  async parse(value: any) {
    return parseFloat(value);
  }
}

module.exports = Float;
