/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */

import * as bcrypt from 'bcryptjs';
import Text from './Text';

export default class Hash extends Text {
  saltRounds: number;

  constructor(min: number = null, max: number = null, flags: number = null, saltRounds: number = 10) {
    super(min, max, undefined, flags);

    this.saltRounds = saltRounds;
  }

  async parse(value: any): Promise<any> {
    if (await super.parse(value)) {
      return bcrypt.hash(value, this.saltRounds);
    }
    return undefined;
  }

  static async validate(value, hash) {
    return bcrypt.compare(value, hash);
  }
}
