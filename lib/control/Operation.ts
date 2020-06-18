/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import Functor from "../utility/Functor";
import State from "./State";

export default class Operation extends Functor {
  path: string;

  dependencies: Array<string>;

  dependents: Array<string>;

  constructor(path: string, fn: Function, cacheable: boolean, dependents = [], dependencies = []) {
    super();

    this.__call__ = async (args) => {
      let result;

      try {
        result = <State>await fn(args);

        if (!(result instanceof State)) {
          console.log("Unexpected result:", result);
          throw new Error("Internal Server Error.");
        }
      } catch (err) {
        console.log(err);
        result = State.INTERNAL_SERVER_ERROR("An error occurred.");
      }

      result.$dependencies(...this.dependencies);

      return result;
    };

    this.path = path;
    this.dependents = cacheable ? [] : [path, ...dependents];
    this.dependencies = cacheable ? [path, ...dependencies] : [];
  }

  isCacheable() {
    return this.dependents.length === 0;
  }
}
