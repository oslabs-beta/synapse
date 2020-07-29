/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable import/no-cycle */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/extensions */

import State from '../State';
import Relation from '../utility/Relation';
import Operation from './Operation';

/** Abstract interface representing a subset of the {@linkcode Manager} class caching functionality that can be maintained in a simple key-value store. */
export class Cache {
  /**
   * Stores a {@linkcode State} instance such that it can later be retrieved by its _{@linkcode State.$query|query} string_ via a call to {@linkcode Cache.getState|Cache.prototype.getState}, and such that its _query string_ can be retrieved via a call to {@linkcode Cache.getQueries|Cache.prototype.getQueries} with any of the state's _{@linkcode State.$dependencies|dependent} paths_.
   * @param state
   */
  async setState(state: State): Promise<boolean> {
    return false;
  }

  /**
   * Removes the {@linkcode State} instance associated with a given _```query``` string_ from the cache.
   * @param query A _query string_.
   */
  async unset(query: string): Promise<boolean> {
    return false;
  }

  /**
   * Retrieves the state associated with a given _```query``` string_ from the cache, or ```undefined``` if no such state exists.
   * @param query A _query string_.
   */
  async getState(query: string): Promise<State> {
    return null;
  }

  /**
   * Returns the _query strings_ of all cached {@linkcode State|states} that are dependent on the state at the given ```paths```.
   * @param paths A _path_ string or array of _path_ strings.
   */
  async getQueries(paths: string | Array<string>): Promise<Array<string>> {
    return [];
  }
}

import LocalCache from '../cache/LocalCache';

/** Singleton which manages state of all known _paths_. It provides two functionalities: 1) Executes {@linkcode Operation|Operations} to either cache the resulting {@linkcode State} in conjuction with its {@linkcode State.$query|_query_} or invalidate its dependent _paths_, and 2) Accepts subscriptions to cached {@linkcode State} via _queries_ and notifies relevant subscribers whenever cached {@linkcode State} change. */
export default class Manager {
  /** The instance of Manager (or derived class) currently accessible via the Manager singleton, using {@linkcode Mangager.access}. */
  private static instance: Manager;

  /** The maximum number of queries that can be cached before an {@linkcode Manager.evict|eviction} occurs. */
  protected maxSize: number = 25000;

  /** An object that implements the {@linkcode Cache} interface, which will be used to store cached {@linkcode State} and dependency graphs. By defualt, this is an instance of {@linkcode LocalCache}, but when operating in a clustered environment, this should overriden with a global cache. */
  private globals: Cache = new LocalCache();

  /** Stores _queries_ which are actively being calculated, along with a promise resolving to their eventual state. */
  private active: Map<string, Promise<State>> = new Map();

  /** Maps _queries_ to cacheable {@linkcode Operation|operations} that will be invoked to recalculate their {@linkcode Manager.states|state}. */
  private operations: Map<string, Operation> = new Map();

  /** Maps _subscribers_ (represented by callback functions) to _queries_ and vice versa. Whenever a _query_ is {@linkcode Manager.cache|recalculated}, its associated _subscribers_ will be invoked with the resulting state. */
  private subscriptions: Relation<Function, string> = new Relation();

  /** A set containing functions ```(path, internal) => {...}``` which will be invoked when any _path_ is invalidated, with the invalidated _path_ string and a boolean denoting whether the invalidating initiated by a caller other than the {@linkcode Manager}. */
  private listeners: Set<Function> = new Set();

  constructor(maxSize: number = null) {
    if (maxSize) {
      this.maxSize = maxSize;
    }
  }

  /** Executes the given {@linkcode Operation|operation} and stores it as well as the resulting {@linkcode State|state} in association with the operation's {@linkcode Operation.query|query}.
   */
  private async cache(operation: Operation): Promise<State> {
    const { query } = operation;

    // if the query is already being calculated, return the promise resolving to it's eventual state
    if (this.active.has(query)) {
      return this.active.get(query);
    }

    // otherwise, remove the operation from the operation map if it already exists, in order to maintain the map keys in order of LRU
    this.operations.delete(query);

    // execute the operation, first storing a promsie in the active map to prevent dependency cycles
    this.active.set(query, operation());
    const state = await this.active.get(query);
    this.active.delete(query);

    // if the result is an error, don't cache it and cancel all subscriptions
    if (state.isError()) {
      await this.unset(query);
      return state;
    }

    // otherwise, cache the operation and resulting state, and run an eviction check
    this.operations.set(query, operation);
    await this.globals.setState(state);
    await this.evict();

    // and notify subscribers with the new state
    for (const client of this.subscriptions.to(query)) {
      client(query, state);
    }

    return state;
  }

  /** Removes the oldest cached query with no associated subscribers.
   * @param query A _query_ string.
   */
  private async evict(): Promise<boolean> {
    if (this.operations.size > this.maxSize) {
      for (const query of this.operations.keys()) {
        if (!this.subscriptions.to(query).next().value) {
          await this.unset(query);
          return true;
        }
      }
    }
    return false;
  }

  /** Removes a _query_ from the cache along with all of its associations.
   * @param query A _query_ string.
   */
  private async unset(query: string) {
    this.operations.delete(query);
    this.globals.unset(query); // fix

    for (const client of this.subscriptions.to(query)) {
      this.unsubscribe(client, query);
      client(query, null);
    }
  }

  /** Invalidates a _path_, possibly alerting {@linkcode Manager.listeners|listeners} and causing all associated _queries_ to be recalculated.
   * @param path A _path_ string or array of _path_ strings.
   * @param override If ```true```, signifies that listeners should not be notified of the invalidated paths.
   */
  async invalidate(paths: string | Array<string>, override: boolean = false) {
    // get all of the unique queries associated with the collection of paths
    const queries = await this.globals.getQueries(paths);

    await Promise.all(
      queries.map(async (query: string) => {
        if (!this.operations.has(query)) {
          return null;
        }
        if (!this.subscriptions.to(query).next().value) {
          return this.unset(query); // if the query has no subscribers, remove it from the cache
        }
        return this.cache(this.operations.get(query)); // otherwise, recalculate its state
      })
    );

    // notify the listeners of the invalidated paths
    if (!override) {
      this.listeners.forEach((client) => {
        client(paths, State.OK());
      });
    }
  }

  /** Safely invokes an {@linkcode Operation|operation}, caching the resulting {@linkcode State|state} if applicable or otherwise invalidating dependent paths. */
  async execute(operation: Operation): Promise<State> {
    const { query } = operation;

    if (operation.isCacheable) {
      if (this.operations.has(query)) {
        return this.globals.getState(query);
      }

      return this.cache(operation);
    }

    const state = await operation();

    await this.invalidate(operation.dependents);

    return state;
  }

  /** Registers a function ```callback``` to be invoked whenever a path is invalidated.
   * @param callback A function ```(path, internal) => {}```.
   */
  listen(callback: Function): void {
    this.listeners.add(callback);
  }

  /** Unregisters a listener function ```callback```. */
  unlisten(callback: Function): void {
    this.listeners.delete(callback);
  }

  /** Registers a ```subscriber``` to be invoked whenever the state of ```query``` changes.
   * @param callback A function ```(path, state) => {}```.
   */
  subscribe(client: Function, query: string = null): boolean {
    if (!this.operations.has(query)) {
      return false;
    }
    this.subscriptions.link(client, query);
    return true;
  }

  /** Unregisters a ```subscriber``` from the given ```query```, or from all subscribed queries if no ```query``` is provided. */
  unsubscribe(client: Function, query: string = null): void {
    this.subscriptions.unlink(client, query);
  }

  /** Returns the Manager singleton instance. If the singleton instance has not been manually defined using {@linkcode Manager.initialize}, a default instance of {@linkcode Manager} will be created. */
  static access(): Manager {
    if (!this.instance) {
      this.initialize(new Manager());
    }
    return this.instance;
  }

  /**
   * Sets the Manager singleton instance that will be {@linkcode Manager.access|accessible} throughout the application instance.
   * @param instance
   */
  static initialize(instance: Manager): void {
    this.instance = instance;
  }
}
