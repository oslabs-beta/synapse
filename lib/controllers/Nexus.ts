/* eslint-disable no-underscore-dangle */
/* eslint-disable lines-between-class-members */
/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */
/* eslint-disable import/no-cycle */

import Functor from "../utilities/Functor";
import State from "../delegates/State";
import Schema from "../validators/Schema";
import Manager from "./Manager";
import { routeToPath } from "../utilities";

export default class Nexus extends Functor {
  method: string;
  pattern: string;
  schema: Schema = new Schema();
  dependencies: Array<string> = [];
  dependents: Array<string> = [];
  authorizer: Function;

  constructor(target: Function) {
    super();

    const execute = async (args: object) => {
      const result = await State.evaluate(target, args);

      if (!result.isError()) {
        if (this.method === "get") {
          [this.pattern, ...this.dependencies].forEach((pattern) => {
            result.__meta__.dependencies.add(routeToPath(pattern, args));
          });
        } else if (this.method) {
          [this.pattern, ...this.dependents].forEach((pattern) => {
            Manager.invalidate(routeToPath(pattern, args));
          });
        }
      }

      return result;
    };

    this.__call__ = async (...args) => {
      const validated = await this.schema.validate(args[0]);

      if (!validated) {
        return State.BAD_REQUEST(this.schema.lastError);
      }

      if (this.method !== "get") {
        return execute(validated);
      }

      const query = routeToPath(this.pattern, validated, true);
      return Manager.cache(query, () => execute(validated));
    };
  }

  try = async (args: object) => {
    const chain: Array<Function> = [this];
    if (this.authorizer) {
      chain.unshift(this.authorizer);
    }

    return State.evaluate(chain, args);
  };
}
