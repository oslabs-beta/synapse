/* eslint-disable import/extensions */

import Text from "./Text";

export default class Word extends Text {
  saltRounds: number;

  constructor(
    min: number = null,
    max: number = null,
    defaultVal: any = undefined,
    flags: number = null
  ) {
    super(min, max, defaultVal, flags);

    this.assert(/[^\w]/, false, "must contain only alphanumeric characters");
  }
  /**
   * Checks if the inputed value is valid by calling the parse methods in Text and Field.
   * Serializes the input by converting it to lowercase.
   * @param value A user's input.
   * @returns The serialized version of its input or undefined if the input value is not valid.
   */

  async parse(value: any) {
    const valid = await super.parse(value);
    if (!valid) {
      return undefined;
    }
    return valid.toLowerCase();
  }
}
