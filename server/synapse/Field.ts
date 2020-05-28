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
<<<<<<< HEAD
   * Checks to see if the inputted value is undefined or null.
   * If so, it will check if the input is optional and assign it a default value if it is, and undefined if not.
   * @param value The user's inputted value.
   * @returns The value itself if it is not undefined/null, a default value if the input is undefined/null AND it is optional, or undefined if the input is undefined/null AND it is not optional.
=======
   * Checks if the input value is valid.
   * If the input is null or undefined and the 'optional' flag is set, returns the default value.
   * @param value Input for the specified field
   * @returns Parsed value if it passed the tests,
   * "undefined" if any of the tests failed.
>>>>>>> 80f2d4a9f2fcdeea4f70749fd11222df5f4f362b
   */
  async parse(value) {
    if (value === undefined || value === null) {
      return this.hasFlag(OPT) ? this.default : undefined;
    }
    return value;
  }
}

module.exports = { Field, OPT, PRV };
