/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import State from './State';
import Resource from './Resource';

/** Represents of a collection of {@linkcode Resource} instances. As the {@linkcode Collection} class inherits from {@linkcode State}, instances of {@linkcode Collection} also represent valid request responses. */
export default class Collection extends State {
  resources: Array<Resource>;

  constructor(resources: Array<Resource>) {
    super(200);

    this.resources = [];

    resources.forEach((el) => {
      if (!(el instanceof Resource)) {
        throw new Error('Expected array containing only values of type Resource.');
      }
      this.resources.push(el);
    });

    this.resources.forEach((el) => this.$dependencies.push(...el.$dependencies));
  }

  render(): object {
    return this.resources.map((el) => el.render());
  }
}
