/* eslint-disable no-bitwise */

export {};

const OPT = 0b001; // optional flag
const PRV = 0b010; // private flag

/**
 * Creates an instance of 'Field' that has a 'type' of value along with the methods
 * that are associated with the class.
 */
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

  /**
   * Checks if the specified flag is set on this.flags.
   * @param flag Options being passed into the new fields. Ex: Private/Optional.
   * @returns A boolean determining whether or not the flag is present.
   */
  hasFlag(flag) {
    return !!(this.flags & flag);
  }

  /**
   * Checks if the input value is valid.
   * If the input is null or undefined and the 'optional' flag is set, returns the default value.
   * @param value Input for the specified field
   * @returns Parsed value if it passed the tests,
   * "undefined" if any of the tests failed.
   */
  async parse(value) {
    if (value === undefined || value === null) {
      return this.hasFlag(OPT) ? this.default : undefined;
    }
    return value;
  }
}

module.exports = { Field, OPT, PRV };
