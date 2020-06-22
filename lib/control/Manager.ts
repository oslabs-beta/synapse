/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */

import Cache from '../utility/Cache';
import State from './State';
import Relation from '../utility/Relation';
import Operation from './Operation';
import { routeToPath } from '../utility';

/** Singleton which manages state of all known _paths_. It provides two functionalities: 1) Executes {@linkcode Operation|Operations} to either cache the resulting {@linkcode State} in conjuction with its {@linkcode State.$query|_query_} or invalidate its dependent _paths_, and 2) Accepts subscriptions to cached {@linkcode States} via _queries_ and notifies relevant subscribers whenever cached {@linkcode States} change. */
export default class Manager extends Cache {
  /** Maps _paths_ to _queries_. Whenever a _path_ is {@linkcode Manager.invalidate|invalidated}, its associated _queries_ will be {@linkcode Manager.set|recalculated}. */
  private static dependents: Relation<string, string> = new Relation();

  /** Maps _subscriber_ functions ```(path, state) => {}``` to _queries_ and vice versa. Whenever a _query_ is {@linkcode Manager.set|recalculated}, its associated _subscribers_ will be invoked with the resulting state. */
  private static subscriptions: Relation<Function, string> = new Relation();

  /** A set containing functions ```(path, internal) => {...}``` which will be invoked when any _path_ is invalidated, with the invalidated _path_ string and a boolean denoting whether the invalidating initiated by a caller other than the {@linkcode Manager}. */
  private static listeners: Set<Function> = new Set();

  static remove(query: string): void {
    super.remove(query);

    this.dependents.unlink(null, query);

    this.subscriptions.to(query).forEach((subscriber) => {
      this.unsubscribe(subscriber, query);
      subscriber(query, null);
    });
  }

  static async set(query: string, source: Function = null): Promise<State> {
    const state: State = await super.set(query, source);

    if (state.isError()) {
      this.remove(query);
      return state;
    }

    this.dependents.unlink(null, query);
    state.$dependencies.forEach((path: string) => {
      this.dependents.link(path, query);
    });

    this.subscriptions.to(query).forEach((subscriber) => {
      subscriber(query, state);
    });

    return state;
  }

  /** Invalidates a _path_, alerting {@linkcode Manager.listeners|listeners} and causing all associated _queries_ to be recalculated.
   * @param path A _path_ string.
   * @param flags
   */
  static invalidate(path: string, flags: object = {}): void {
    this.listeners.forEach((subscriber) => {
      const state = State.OK();
      Object.assign(state.$flags, flags);
      subscriber(path, state);
    });

    const queries = this.dependents.from(path);
    queries.forEach(async (_query) => this.set(_query));
  }

  /** Safely invokes an {@linkcode Operation|operation}, caching the resulting {@linkcode State|state} if applicable or otherwise invalidating dependent paths. */
  static async execute(operation: Operation, args: object, flags: object = {}): Promise<State> {
    const query = routeToPath(operation.path, args, true);

    const calc = async () => {
      const state = await operation(args);
      state.$query = query;
      Object.assign(state.$flags, flags);
      return state;
    };

    if (operation.isCacheable()) {
      if (this.has(query)) {
        return this.get(query);
      }
      return this.set(query, calc);
    }

    const state = await calc();
    new Set(operation.dependents).forEach((path) => this.invalidate(path, flags));
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
  static subscribe(subscriber: Function, query: string = null): boolean {
    if (!this.has(query)) {
      return false;
    }
    this.subscriptions.link(subscriber, query);
    return true;
  }

  /** Unregisters a ```subscriber``` from the given ```query```, or from all subscribed queries if no ```query``` is provided. */
  static unsubscribe(subscriber: Function, query: string = null): void {
    this.subscriptions.unlink(subscriber, query);
  }
}
