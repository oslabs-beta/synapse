/* eslint-disable import/extensions */
/* eslint-disable class-methods-use-this */

import Number from "./Number";

export default class Integer extends Number {
  async parse(value: any) {
    return parseInt(value, 10);
  }
}
