/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */
/* eslint-disable no-bitwise */

import Field from "../state/Field";

export default class Text extends Field {
  /**
   * Set of rules to validate input.
   * Filled with the RegExp provided when custom fields are created.
   */
  rules = [];

  constructor(min: number = null, max: number = null, defaultVal: any = null, flags: number = null) {
    super(defaultVal, flags);

    if (min) {
      this.assert(`.{${min}}`, true, `must be at least ${min} characters`);
    }
    if (max) {
      this.assert(`.{${max + 1}}`, false, `must be at most ${max} characters`);
    }
  }

  /**
   * Adds a rule to the Text instance.
   * @param rule A regular expression rule
   * @param expect The expected result of matching a string against the regular expression
   * @param message A human-readable explanation of the rule
   */
  assert(rule: any, expect: boolean = true, message: string = "") {
    const regex = rule instanceof RegExp ? rule : new RegExp(rule);
    this.rules.push({ regex, expect, message });
  }

  /**
   * Verifies that a user's input is in the correct format of a string and that it had passed its RegExp test(s).
   * If the input is null or undefined, obtains the default value if one exists.
   * @param value User input to be checked.
   * @returns Undefined if the value is not a string or if it didn't pass the tests, or the value itself if it does.
   */

  /*
   * Overrides Field.prototype.parse.
   * If the input value is null or undefined, obtains the default value, if one exists.
   * If the input value is a string, determines if the value matches matches all the 'positive' regular expressions and none of the 'negative' ones.
   */
  async parse(value: any) {
    if (!value) {
      return super.parse(value);
    }
    if (typeof value === "object" && value.toString) {
      value = value.toString();
    }
    if (typeof value === "string") {
      for (let i = 0; i < this.rules.length; ++i) {
        const { regex, expect, message } = this.rules[i];
        if (!!value.match(regex) !== expect) {
          this.lastError = message;
          return undefined;
        }
      }
      return value;
    }
    return undefined;
  }
}
