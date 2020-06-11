/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
/* eslint-disable lines-between-class-members */
/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */
/* eslint-disable import/no-cycle */

import Functor from "../utilities/Functor";
import State from "../delegates/State";
import Schema from "../validators/Schema";
import Operation from "../delegates/Operation";
import Manager from "./Manager";
import Router from "../utilities/Router";
import { routeToPath } from "../utilities";

export default class Controller extends Functor {
  static router = new Router();

  pattern: string;
  dependencies: Array<string> = [];
  dependents: Array<string> = [];
  schema: Schema = new Schema();
  authorizer: Function;
  cacheable: boolean;

  constructor(target: Function) {
    super();

    this.__call__ = async (...args) => {
      const validated = await this.schema.validate(args[0]);

      if (!validated) {
        return State.BAD_REQUEST(this.schema.lastError);
      }

      const path = routeToPath(this.pattern, validated);
      const dependents = this.dependents.map((pattern) => routeToPath(pattern, validated));
      const dependencies = this.dependencies.map((pattern) => routeToPath(pattern, validated));

      const op = new Operation(path, target, this.cacheable, dependents, dependencies);

      return Manager.execute(op, validated);
    };
  }

  try = async (args: object) => {
    const authorized = this.authorizer(args);

    if (authorized instanceof State) {
      return authorized;
    }

    return this();
  };

  expose = (method, pattern): Controller => {
    this.pattern = pattern;
    this.cacheable = method === "get";
    Controller.router.declare(method, pattern, this);
    return this;
  };
  static request = (method: string, path: string, args: object): Promise<State> => {
    return Controller.router.request(method, path, args);
  };
}
