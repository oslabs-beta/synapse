/* eslint-disable no-bitwise */

export {};

const OPT = 0b001; // optional flag

/**
 * Creates an instance of 'Field' that has a 'type' of value along with the methods
 * that are associated with the class.
 */
class Field {
  default: any;

  flags: number;

  /**
   * Set of rules to validate input.
   * Filled with the RegExp provided when custom fields are created.
   */
  rules = {
    positive: [],
    negative: [],
  };
  /**
   * @param defaultVal Value to be used in constructor (null by default).
   * @param flags Custom flags to describe a field. Ex: Private/Optional.
   */

  constructor(defaultVal: any = null, flags: number = 0) {
    this.default = defaultVal;
    this.flags = flags;
  }

  /**
   * Checks if the specified flag is set on this.flags.
   * @param flag Options being passed into the new fields. Ex: Private/Optional.
   * @returns A boolean determining whether or not the flag is present.
   */

  hasFlag(flag) {
    return !!(this.flags & flag);
  }

  /**
   * Adds a regular expression to this.rules.
   * When 'negate' is set to true, the 'parse' function will assert that the regular expression evaluate to false.
   * @param rule A RegExp rule.-
   * @param negate A boolean to determine what the RegExp should evaluate to
   */
  conform(rule, negate = false) {
    const regex = rule instanceof RegExp ? rule : new RegExp(rule);
    if (negate) {
      this.rules.negative.push(regex);
    } else {
      this.rules.positive.push(regex);
    }
  }

  /**
   * Checks if the input value is valid. Using
   * If the input is null or undefined and the 'optional'
   * flag is set, returns the default value.
   * @param value Input for the specified field
   * @returns Parsed value if it passed the tests,
   * "undefined" if any of the tests failed.
   */
  async parse(value) {
    if (value === undefined || value === null) {
      return this.hasFlag(OPT) ? this.default : undefined;
    }
    // currently just checks to see if the value is a string
    if (typeof value === 'string') {
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
