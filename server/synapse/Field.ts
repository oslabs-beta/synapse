/* eslint-disable no-bitwise */

export {};

const OPT = 0b001;

class Field {
  default: any;

  flags: number;

  rules = {
    positive: [],
    negative: [],
  };

  constructor(defaultVal: any = null, flags: number = 0) {
    this.default = defaultVal;
    this.flags = flags;
  }

  hasFlag(flag) {
    return !!(this.flags & flag);
  }

  conform(rule, negate = false) {
    const regex = rule instanceof RegExp ? rule : new RegExp(rule);
    if (negate) {
      this.rules.negative.push(regex);
    } else {
      this.rules.positive.push(regex);
    }
  }

  async parse(value) {
    if (value === undefined || value === null) {
      return this.hasFlag(OPT) ? this.default : undefined;
    }

    if (typeof value === "string") {
      for (let i = 0; i < this.rules.positive.length; ++i) {
        if (!value.match(this.rules.positive[i])) {
          return undefined;
        }
      }
      for (let i = 0; i < this.rules.negative.length; ++i) {
        if (value.match(this.rules.negative[i])) {
          return undefined;
        }
      }
    }

    return value;
  }
}

module.exports = { Field, OPT };
