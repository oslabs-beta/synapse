/* eslint-disable import/extensions */

import Enum from './Enum';

export default class Boolean extends Enum {
  constructor(defaultVal, flags) {
    super(['true', 'false'], defaultVal, flags);
  }

  async parse(value: any): Promise<any> {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 0 || value === 1) {
      return !!value;
    }
    return super.parse(value);
  }
}
