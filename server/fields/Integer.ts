/* eslint-disable class-methods-use-this */

export {};

const { Number } = require('./Number');

class Integer extends Number {
  async parse(value: any) {
    return parseInt(value, 10);
  }
}

module.exports = Integer;
