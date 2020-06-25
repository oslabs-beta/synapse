/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */
/* eslint-disable no-bitwise */

import Field from '../Field';

export default class Text extends Field {
  rules = [];

  constructor(min: number = null, max: number = null, defaultVal: any = undefined, flags: number = null) {
    super(defaultVal, flags);

    if (min) {
      this.assert(`.{${min}}`, true, `must be at least ${min} characters`);
    }
    if (max) {
      this.assert(`.{${max + 1}}`, false, `must be at most ${max} characters`);
    }
  }

  assert(rule: any, expect: boolean = true, message: string = '') {
    const regex = rule instanceof RegExp ? rule : new RegExp(rule);
    this.rules.push({ regex, expect, message });
  }

  async parse(value: any) {
    if (!value) {
      return super.parse(value);
    }
    if (typeof value === 'object' && value.toString) {
      value = value.toString();
    }
    if (typeof value === 'string') {
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
