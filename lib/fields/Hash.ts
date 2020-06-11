/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */

import * as bcrypt from "bcryptjs";
import Text from "./Text";

export default class Hash extends Text {
  saltRounds: number;

  constructor(min: number = null, max: number = null, flags: number = null, saltRounds: number = 10) {
    super(min, max, null, flags);

    this.saltRounds = saltRounds;
  }

  /**
   * Checks to see if a user's input is in the correct format and if so, hashes it using bcrypt.
   * @param value A user's input.
   * @returns A hashed version of the input if it passed its tests or undefined if it did not.
   */

  async parse(value: any) {
    if (await super.parse(value)) {
      return bcrypt.hash(value, this.saltRounds);
    }
    return undefined;
  }

  static async validate(value, hash) {
    return bcrypt.compare(value, hash);
  }
}
