/* eslint-disable no-bitwise */
export {};

<<<<<<< HEAD
const OPT = 0b001;

=======
const OPT = 0b001; // optional flag
const PRV = 0b010; // private flag

/**
 * Creates an instance of 'Field' that has a 'type' of value along with the methods
 * that are associated with the class.
 */
>>>>>>> 0ff72496acf4a7b48a69e0b48c48c15ee486f85c
class Field {
  default: any;

  flags: number;

  lastError: string;

  /**
   * @param defaultVal Value to be used in constructor (null by default).
   * @param flags Custom flags to describe a field. Ex: Private/Optional.
   */
  constructor(defaultVal: any = null, flags: number = null) {
    this.default = defaultVal;
    this.flags = flags;
  }

<<<<<<< HEAD
  conform(rule, negate = false) {
    const regex = rule instanceof RegExp ? rule : new RegExp(rule);
    if (negate) {
      this.rules.negative.push(regex);
    } else {
      this.rules.positive.push(regex);
    }
  }

=======
  /**
   * Checks if the specified flag is set on this.flags.
   * @param flag Options being passed into the new fields. Ex: Private/Optional.
   * @returns A boolean determining whether or not the flag is present.
   */
  hasFlag(flag) {
    return !!(this.flags & flag);
  }

  /**
   * Checks if the input value is valid. Using
   * If the input is null or undefined and the 'optional'
   * flag is set, returns the default value.
   * @param value Input for the specified field
   * @returns Parsed value if it passed the tests,
   * "undefined" if any of the tests failed.
   */
>>>>>>> 0ff72496acf4a7b48a69e0b48c48c15ee486f85c
  async parse(value) {
    if (value === undefined || value === null) {
      return this.flags | OPT ? this.default : undefined;
    }
    return value;
  }
}

module.exports = { Field, OPT, PRV };
