/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import { Functor } from ".";

export default class Query extends Functor {
  path: string;

  id: string;

  constructor(source, path, id) {
    super();

    this.__call__ = source;
    this.path = path;
    this.id = id;
  }
}
