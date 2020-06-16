/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import Functor from "../utility/Functor";
import State from "./State";
import Schema from "../state/Schema";
import Operation from "./Operation";
import Manager from "./Manager";
import Router from "../utility/Router";
import { routeToPath } from "../utility";

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

    this.__call__ = async (args: object, flags: object = {}) => {
      const validated = await this.schema.validate(args);

      if (!validated) {
        return State.BAD_REQUEST(this.schema.lastError);
      }

      if (!this.pattern) {
        return target(validated);
      }

      const path = routeToPath(this.pattern, validated);
      const dependents = this.dependents.map((pattern) => routeToPath(pattern, validated));
      const dependencies = this.dependencies.map((pattern) => routeToPath(pattern, validated));

      const op = new Operation(path, target, this.cacheable, dependents, dependencies);

      return Manager.execute(op, validated, flags);
    };
  }

  try = async (args: object, flags: object = {}) => {
    const authorized = this.authorizer ? await this.authorizer(args) : args;

    if (authorized instanceof State) {
      return authorized;
    }

    return this(authorized, flags);
  };

  expose = (method: string, pattern: string): Controller => {
    this.pattern = pattern;
    this.cacheable = method === "get";
    Controller.router.declare(method, pattern, (args, flags) => this.try(args, flags));
    return this;
  };

  static request = async (
    method: string,
    path: string,
    args: object = {},
    flags: object = {}
  ): Promise<State> => {
    return Controller.router.request(method, path, args, flags);
  };
}
