/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */

import Store from "../utilities/Store";
import Relation from "../utilities/Relation";

/** Represents an instance of an API server. Acts as an abstraction layer between network protocols and resource business logic. Manages caching, subscription, and state management of resources. */
export default class Manager {
  /** Maps _query strings_ to their cached state. */
  static state: Map<string, any> = new Map();

  /** Maps _query strings_ to _generators_ (functions that accept no arguments and return an instance of {@linkcode State}). */
  static source: Map<string, Function> = new Map();

  /** Maps _resource paths_ to _query strings_. */
  static dependents: Relation<string, string> = new Relation();

  /** Maps clients (represented by callback functions) to _query strings_ and vice versa. */
  static subscriptions: Relation<Function, string> = new Relation();

  static has(key: string) {
    return this.source.has(key);
  }

  static read(key: string) {
    return this.state.get(key);
  }

  static remove(key: string) {
    this.state.delete(key);
    this.source.delete(key);
  }

  static async set(query: string, source: Function = null) {
    const subscriptions = this.subscriptions.to(query);

    if (source) {
      this.source.set(query, source);
    }
    this.state.set(query, await this.source.get(query)());

    const state = this.read(query);

    if (state.isError()) {
      this.remove(state);

      this.dependents.unlink(null, query);

      subscriptions.forEach((client) => {
        this.unsubscribe(client, query);
        client(query, null);
      });

      return state;
    }

    this.dependents.unlink(null, query);
    state.dependencies().forEach((path: string) => {
      this.dependents.link(path, query);
    });

    subscriptions.forEach((client) => {
      client(query, state.render());
    });

    Object.assign(state.__meta__, { query }); // fix

    return state;
  }

  static subscribe(client: Function, query: string) {
    if (!this.has(query)) {
      return null;
    }

    this.subscriptions.link(client, query);
    client(query, this.read(query));
    return query;
  }

  static unsubscribe(client: Function, query: string = null) {
    this.subscriptions.unlink(client, query);
  }

  static async cache(query: string, source: Function) {
    if (this.has(query)) {
      return this.read(query);
    }

    return this.set(query, source);
  }

  static async invalidate(path: string) {
    const queries = this.dependents.from(path);
    return Promise.all(queries.map(async (query) => this.set(query)));
  }
}
