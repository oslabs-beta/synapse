/* eslint-disable import/extensions */

import Text from './Text';

export default class Enum extends Text {
  constructor(options, defaultVal, flags) {
    super(null, null, defaultVal, flags);

    this.assert(
      options.map((val) => `(${val})`).join('|'),
      true,
      `must be one of the following values: ${options.join(', ')}.`
    );
  }
}
