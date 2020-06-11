/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import Functor from "../utilities/Functor";
import { routeToPath } from "../utilities";

export default class Query extends Functor {
  query: string;

  constructor(source, pattern, args) {
    super();

    this.__call__ = () => source(args);
    this.query = routeToPath(pattern, args, true);
  }
}
