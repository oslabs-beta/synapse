/* eslint-disable no-bitwise */

export {};

const OPT = 0b001; // optional flag
const PRV = 0b010; // private flag

/*
  Represents a type of value. Stores properties which define that type.
  Can validate and may transform an input value.
*/
class Field {
  default: any;

  flags: number;

  lastError: string;

  constructor(defaultVal: any = null, flags: number = null) {
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
    The 'parse' function should check if the input is of,
    or can be converted to, the Field type. The base
    implementation only checks for empty values.

    If the input is null or undefined and the 'optional'
    flag is set, returns the default value. 
  */
  async parse(value) {
    if (value === undefined || value === null) {
      return this.hasFlag(OPT) ? this.default : undefined;
    }
    return value;
  }
}

module.exports = { Field, OPT, PRV };
