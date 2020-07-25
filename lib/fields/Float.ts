/* eslint-disable import/extensions */
/* eslint-disable class-methods-use-this */

import Number from './Number';

export default class Float extends Number {
  async parse(value: any): Promise<any> {
    return parseFloat(value);
  }
}
