/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */

import Store from "../utilities/Store";
import Relation from "../utilities/Relation";

/** Represents an instance of an API server. Acts as an abstraction layer between network protocols and resource business logic. Manages caching, subscription, and state management of resources. */
export default class Manager {
  /** Maps _query strings_ to their current state and associated generator functions. */
  static store: Store = new Store();

  /** Maps _resource paths_ to _query strings_. */
  static queries: Relation<string, string> = new Relation();

  /** Maps clients (represented by callback functions) to _query strings_ and vice versa. */
  static subscriptions: Relation<Function, string> = new Relation();

  static subscribe(client: Function, query: string) {
    if (!this.store.has(query)) {
      return null;
    }

    this.subscriptions.link(client, query);
    client(query, this.store.read(query));
    return query;
  }

  static unsubscribe(client: Function, query: string = null) {
    this.subscriptions.unlink(client, query);
  }

  static async analyze(query: string) {
    const state = this.store.read(query);

    this.queries.unlink(null, query);
    state.dependencies().forEach((path: string) => {
      this.queries.link(path, query);
    });
  }

  static async cache(query: string, source: Function) {
    if (this.store.has(query)) {
      return this.store.read(query);
    }

    const result = await this.store.set(query, source);

    if (!result.isError()) {
      this.analyze(query);
      result.__meta__.query = query; // fix
    } else {
      this.store.remove(query);
    }

    return result;
  }

  static async invalidate(path: string) {
    const queries = this.queries.from(path);

    const invalid = queries.map(async (query) => {
      const result = await this.store.reset(query);

      const subscriptions = this.subscriptions.to(query);

      if (!result.isError()) {
        this.analyze(query);
        subscriptions.forEach((client) => {
          client(query, result.render());
        });
      } else {
        subscriptions.forEach((client) => {
          this.unsubscribe(client, query);
          client(query, null);
        });

        this.store.remove(query);
        this.queries.unlink(null, query);
      }
    });

    return Promise.all(invalid);
  }
}
