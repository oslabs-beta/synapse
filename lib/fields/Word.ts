/* eslint-disable import/extensions */

import Text from './Text';

export default class Word extends Text {
  saltRounds: number;

  constructor(
    min: number = undefined,
    max: number = undefined,
    defaultVal: any = undefined,
    flags: number = null
  ) {
    super(min, max, defaultVal, flags);

    this.assert(/[^\w]/, false, 'must contain only alphanumeric characters');
  }

  async parse(value: any): Promise<any> {
    const check = await super.parse(value);
    if (!check) {
      return check;
    }
    return check.toLowerCase();
  }
}
