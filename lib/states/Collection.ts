/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import State from "../delegates/State";
import Resource from "./Resource";

export default class Collection extends State {
  resources: Array<Resource>;

  constructor(resources: Array<Resource>) {
    super(200);

    this.resources = [];

    resources.forEach((el) => {
      if (!(el instanceof Resource)) {
        throw new Error("Expected array containing only values of type Resource.");
      }
      this.resources.push(el);
    });

    this.resources.forEach((el) => el.dependencies().forEach((path) => this.__meta__.dependencies.add(path)));
  }

  render(): object {
    return this.resources.map((el) => el.render());
  }
}
