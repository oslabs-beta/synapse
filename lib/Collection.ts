/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import Resource from "./Resource";
import State from "./interface/State";

export default class Collection extends State {
  resources: Array<Resource>;

  constructor(resources: Array<Resource>) {
    super();

    resources.forEach((el) => {
      if (!(el instanceof Resource)) {
        throw new Error("Expected array containing only values of type Resource.");
      }
      this.resources.push(el);
    });
  }

  status(): number {
    return 200;
  }

  isError(): boolean {
    return false;
  }

  toObject(): object {
    return this.resources.map((el) => el.toObject());
  }

  getRefs(): Array<string> {
    return this.resources.map((el) => el.path());
  }
}
