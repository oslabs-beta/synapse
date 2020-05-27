/* eslint-disable no-bitwise */

export {};

const { Field } = require("../synapse/Field");

class Text extends Field {
  /**
   * Set of rules to validate input.
   * Filled with the RegExp provided when custom fields are created.
   */
  rules = [];

  constructor(
    min: number = null,
    max: number = null,
    defaultVal: any = null,
    flags: number = null
  ) {
    super(defaultVal, flags);

    if (min) {
      this.assert(`.{${min}}`, true, `must be at least ${min} characters`);
    }
    if (max) {
      this.assert(`.{${max + 1}}`, false, `must be at most ${max} characters`);
    }
  }

  /**
   * Adds a regular expression to this.rules.
   * Changes the rule to be in the RegExp format if it is not already.
   * @param rule A RegExp rule.
   * @param expect A boolean that the RegExp rules should evaluate to.
   * @param message A human-readable explanation of the rule that will be displayed if the tests do not pass.
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
  async parse(value: any) {
    if (!value) {
      return super.parse(value);
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

module.exports = Text;
