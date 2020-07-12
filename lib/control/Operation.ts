/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import Callable from '../utility/Callable';
import State from '../State';
import { routeToPath } from '../utility';

/** Callable type representing a function that either _reads_ or _writes_ the state at a given _path_. When invoked, returns an instance of {@linkcode State}. */
export default class Operation extends Callable {
  /** The _query_ representing the operation. */
  query: string;

  /** Determines whether the operation may be cached. */
  isCacheable: boolean;

  /** The _paths_ which should be invalidated whenever the operation is invoked. */
  dependents: Array<string>;

  /** The _paths_ upon which any {@linkcode State} instance produced by invoking the operation will depend. */
  dependencies: Array<string>;

  /**
   *
   * @param path The _path_ which the operation evaluates. Used to determine the resulting _query_.
   * @param func The function that will be invoked when the instance is invoked.
   * @param args The arguments with which the ```func``` will be invoked and which will be used to construct the instance's {@linkcode Operation.query|query} string.
   * @param isRead Determines whether is the operation is a _read_ or _write_. If the operation is a _read_, the ```path``` will be considered a {@linkcode Operation.dependency|dependency}. If it's a _write_, the ```path``` will be considered a {@linkcode Operation.dependents|dependent}.
   * @param isCacheable See {@linkcode Operation.isCacheable}. Note that this parameter can only be used to make a _read_ operation non-cacheable, not to make a _write_ operation cacheable.
   * @param dependents See {@linkcode Operation.dependents}.
   * @param dependencies See {@linkcode Operation.dependencies}.
   */
  constructor(
    path: string,
    func: Function,
    args: object,
    isRead: boolean,
    isCacheable: boolean,
    dependents = [],
    dependencies = []
  ) {
    super(async () => {
      let result: State;

      try {
        result = <State>await func(args);

        if (!(result instanceof State)) {
          console.log('Unexpected result:', result);
          throw new Error('Internal Server Error.');
        }
      } catch (err) {
        console.log(err);
        result = State.INTERNAL_SERVER_ERROR('An error occurred.');
      }

      result.$query = this.query;
      result.$dependencies.push(...this.dependencies);

      return result;
    });

    this.query = routeToPath(path, args, true);
    this.isCacheable = isCacheable && isRead;
    this.dependents = isRead ? [] : [path, ...dependents];
    this.dependencies = isRead ? [path, ...dependencies] : [];
  }
}
