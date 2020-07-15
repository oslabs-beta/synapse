/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import Callable from '../utility/Callable';
import State from '../State';
import Schema from '../Schema';
import Operation from './Operation';
import Manager from './Manager';
import { routeToPath } from '../utility';

/** Callable type representing a method exposed to an API at a _path {@linkcode Controller.pattern|pattern}_ in the format```/path/:param```. When invoked with an _argument set_, creates an instance of {@linkcode Operation} which is executed by the {@linkcode Manager}. There are two ways to invoke a controller instance: 1) _untrustedly_, using {@linkcode Controller.try|Controller.prototype.try}, which first passes the _argument set_ through an optional {@linkcode Controller.authorizer|authorizer} function, or 2) _trustedly_, using ```()```, which bypasses the authorizer. In both cases, the _argument set_ will first be validated by the {@linkcode Controller.schema}. Optionally, {@linkcode Controller.dependencies|dependencies} and {@linkcode Controller.dependents|dependents} may also be specified as an array of _path patterns_ which will be evaluated at invocation and transferred to the resulting {@linkcode Operation|operation}. */
export default class Controller extends Callable {
  /** A _path pattern_ */
  pattern: string;
  /** An array of _path patterns_. */
  dependencies: Array<string> = [];
  /** An array of _path patterns_. */
  dependents: Array<string> = [];
  /** A {@linkcode Schema} that will be used to validate all invocations. */
  schema: Schema = new Schema();
  /** A function ```(args) => {...}```that will be used to authorize invocations made using {@linkcode Controller.try|Controller.prototype.try}. Should return an object if the _argument set_ was valid, or an instance of {@linkcode State} to abort the operation.  */
  authorizer: Function;
  /** An optional function returning an object to which the controller function will be bound before invocation. */
  instance: Function;
  /** Determines whether the instance represents a _read_ or _write_ operation. */
  isRead: boolean;
  /** Determines whether the instance represents a cacheable operation. */
  isCacheable: boolean;

  /**
   * @param target The function to be transferred to all generated operations.
   */
  constructor(target: Function) {
    super(async (_this: object, args: object = {}) => {
      if (this.instance && !(_this instanceof State)) {
        _this = await this.instance(args);
        if (!(_this instanceof State) || _this.isError()) {
          return State.NOT_FOUND();
        }
      }

      if (_this) {
        args = { ..._this, ...args };
      }

      const validated = await this.schema.validate(args);
      if (!validated) {
        return State.BAD_REQUEST(this.schema.lastError);
      }

      const bound = target.bind(_this);
      if (!this.pattern) {
        return bound(validated);
      }

      const path = routeToPath(this.pattern, validated);
      const dependents = this.dependents.map((pattern) => routeToPath(pattern, validated));
      const dependencies = this.dependencies.map((pattern) => routeToPath(pattern, validated));

      const op = new Operation(
        path,
        bound,
        validated,
        this.isRead,
        this.isCacheable,
        dependents,
        dependencies
      );

      return Manager.execute(op);
    });
  }

  /** When invoked, {@linkcode Controller.authorizer|authorizes} the _argument set_ ```args```, then invokes the instance _trustedly_.
   * @param args An _argument set_.
   */
  try = async (args: object) => {
    const authorized = this.authorizer ? await this.authorizer(args) : args;

    if (authorized instanceof State) {
      return authorized;
    }

    return this(authorized);
  };
}
