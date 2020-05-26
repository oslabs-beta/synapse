/* eslint-disable no-bitwise */

export {};

const OPT = 0b001; // optional flag

/*
  Represents a type of value. Stores properties which define that type.
  Can validate and may transform an input value.
*/
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

  /*
    Checks if the specified flag is set on this.flags.
    Returns true or false.
  */
  hasFlag(flag) {
    return !!(this.flags & flag);
  }

  /*
    Adds a regular expression to this.rules. When
    'negate' is set to true, the 'parse' function will
    assert that the regular expression evaluate to false.
  */
  conform(rule, negate = false) {
    const regex = rule instanceof RegExp ? rule : new RegExp(rule);
    if (negate) {
      this.rules.negative.push(regex);
    } else {
      this.rules.positive.push(regex);
    }
  }

  /*
    Checks if the input value is valid.
    
    If the input is null or undefined and the 'optional'
    flag is set, returns the default value. 
    
    If the input is a string, determines if the value 
    matches matches all the 'positive' regular expressions 
    and none of the 'negative' ones. 
  */
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
