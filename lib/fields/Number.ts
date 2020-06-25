/* eslint-disable import/extensions */
/* eslint-disable no-bitwise */

import Field from '../Field';

export default class Number extends Field {
  min: number;

  max: number;

  constructor(
    min: number = undefined,
    max: number = undefined,
    defaultVal: number = undefined,
    flags: number = null
  ) {
    super(defaultVal, flags);

    this.min = min;
    this.max = max;
  }

  async parse(value: any) {
    const number = typeof value === 'number' ? value : <any>super.parse(value) - 0;

    if (typeof value !== 'number' || this.min < number || number > this.max) {
      return undefined;
    }

    return number;
  }
}
