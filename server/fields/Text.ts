/* eslint-disable no-bitwise */

export {};
<<<<<<< HEAD
const { Field } = require('../synapse/Field');
=======

const { Field } = require("../synapse/Field");
>>>>>>> 0ff72496acf4a7b48a69e0b48c48c15ee486f85c

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

  // Adds a regular expression to this.rules.
  // 'expect' refers to the expected result of
  // matching the expression against a string.
  // A human-readable explanation of the rule
  // can be provided as 'message'
  /**
   * Adds a regular expression to this.rules.
   * When 'negate' is set to true, the 'parse' function will assert that the regular expression evaluate to false.
   * @param rule A RegExp rule.-
   */
  assert(rule: any, expect: boolean = true, message: string = "") {
    const regex = rule instanceof RegExp ? rule : new RegExp(rule);
    this.rules.push({ regex, expect, message });
  }

  /*
    If the input is null or undefined, obtains the default
    value, if one exists.

    If the input is a string, determines if the value 
    matches matches all the 'positive' regular expressions 
    and none of the 'negative' ones. 
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
