/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */

import State from '../State';
import Relation from '../utility/Relation';
import Operation from './Operation';

/** Singleton which manages state of all known _paths_. It provides two functionalities: 1) Executes {@linkcode Operation|Operations} to either cache the resulting {@linkcode State} in conjuction with its {@linkcode State.$query|_query_} or invalidate its dependent _paths_, and 2) Accepts subscriptions to cached {@linkcode State} via _queries_ and notifies relevant subscribers whenever cached {@linkcode State} change. */
export default class Manager {
  /** Maps _queries_ to the {@linkcode State|states} produced by invoking their associated {@linkcode Manager.operations|operations}. */
  private static states: Map<string, State | Promise<State>> = new Map();

  /** Maps _queries_ to cacheable {@linkcode Operation|operations} that will be invoked to recalculate their {@linkcode Manager.states|state}. */
  private static operations: Map<string, Operation> = new Map();

  /** Maps _paths_ to _queries_. Whenever a _path_ is {@linkcode Manager.invalidate|invalidated}, its associated _queries_ will be {@linkcode Manager.cache|recalculated}. */
  private static dependents: Relation<string, string> = new Relation();

  /** Maps _subscribers_ (represented by callback functions) to _queries_ and vice versa. Whenever a _query_ is {@linkcode Manager.cache|recalculated}, its associated _subscribers_ will be invoked with the resulting state. */
  private static subscriptions: Relation<Function, string> = new Relation();

  /** A set containing functions ```(path, internal) => {...}``` which will be invoked when any _path_ is invalidated, with the invalidated _path_ string and a boolean denoting whether the invalidating initiated by a caller other than the {@linkcode Manager}. */
  private static listeners: Set<Function> = new Set();

  /** Executes the given {@linkcode Operation|operation} and stores it as well as the resulting {@linkcode State|state} in association with the operation's {@linkcode Operation.query|query}.
   */
  private static async cache(operation: Operation): Promise<State> {
    const { query } = operation;

    // if the query is already being recalculated, its state will be a Promise
    const probe = this.states.get(query);
    if (probe instanceof Promise) {
      return probe; // the Promise will resolve to the result of the recalculation, so we can just return it.
    }

    this.operations.set(query, operation);

    // in order to prevent dependency cycles:
    this.states.set(query, operation()); // first set the query's state to a promise
    const state = await this.states.get(query); // then wait for the promise to resolve
    this.states.set(query, state); // finally, set the state to the result of the promise

    // if the result is an error, don't cache it
    if (state.isError()) {
      this.unset(query);
      return state;
    }

    // otherwise, reset the query's dependencies
    this.dependents.unlink(null, query);
    state.$dependencies.forEach((path: string) => {
      this.dependents.link(path, query);
    });

    // and notify subscribers with the new state
    this.subscriptions.to(query).forEach((client) => {
      client(query, state);
    });

    return state;
  }

  /** Removes a _query_ from the cache along with all of its associations.
   * @param query A _query_ string.
   */
  private static unset(query: string): void {
    this.states.delete(query);
    this.operations.delete(query);

    this.dependents.unlink(null, query);

    this.subscriptions.to(query).forEach((client) => {
      this.unsubscribe(client, query);
      client(query, null);
    });
  }

  /** Invalidates a _path_, possibly alerting {@linkcode Manager.listeners|listeners} and causing all associated _queries_ to be recalculated.
   * @param path A _path_ string or array of _path_ strings.
   * @param override If ```true```, signifies that listeners should not be notified of the invalidated paths.
   */
  static invalidate(paths: string | Array<string>, override: boolean = false): void {
    // get all of the unique queries associated with the collection of paths
    const queries = new Set();
    new Set(paths).forEach((path) => {
      this.dependents.from(path).forEach((query) => {
        queries.add(query);
      });
    });

    queries.forEach((query: string) => {
      if (this.operations.has(query)) {
        if (this.subscriptions.to(query).length) {
          this.cache(this.operations.get(query)); // the query has subscribers, recalculate its state
        } else {
          this.unset(query); // otherwise just remove it from the cache
        }
      }
    });

    // notify the listeners of the invalidated paths
    if (!override) {
      this.listeners.forEach((client) => {
        client(paths, State.OK());
      });
    }
  }

  /** Safely invokes an {@linkcode Operation|operation}, caching the resulting {@linkcode State|state} if applicable or otherwise invalidating dependent paths. */
  static async execute(operation: Operation): Promise<State> {
    const { query } = operation;

    if (operation.isCacheable) {
      if (this.states.has(query)) {
        return this.states.get(query);
      }

      return this.cache(operation);
    }

    const state = await operation();

    this.invalidate(operation.dependents);

    return state;
  }

  /** Registers a function ```callback``` to be invoked whenever a path is invalidated.
   * @param callback A function ```(path, internal) => {}```.
   */
  static listen(callback: Function): void {
    this.listeners.add(callback);
  }

  /** Unregisters a listener function ```callback```. */
  static unlisten(callback: Function): void {
    this.listeners.delete(callback);
  }

  /** Registers a ```subscriber``` to be invoked whenever the state of ```query``` changes.
   * @param callback A function ```(path, state) => {}```.
   */
  static subscribe(client: Function, query: string = null): boolean {
    if (!this.states.has(query)) {
      return false;
    }
    this.subscriptions.link(client, query);
    return true;
  }

  /** Unregisters a ```subscriber``` from the given ```query```, or from all subscribed queries if no ```query``` is provided. */
  static unsubscribe(client: Function, query: string = null): void {
    this.subscriptions.unlink(client, query);
  }
}
