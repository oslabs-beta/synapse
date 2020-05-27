/* eslint-disable no-bitwise */

export {};

const { Field } = require('../synapse/Field');

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

  async parse(value: any) {
<<<<<<< HEAD
    const number = typeof value === 'number' ? value : <any>super.parse(value) - 0;
=======
    const number = typeof value === "number" ? value : <any>super.parse(value) - 0;
>>>>>>> b826f753624daf4a092b077e7ad97ba5faff2041

    if (typeof value !== 'number' || number < this.min || number > this.max) {
      return undefined;
    }

    return number;
  }
}

module.exports = Number;
