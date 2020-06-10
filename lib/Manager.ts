/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */

import * as querystring from "querystring";
import Store from "./util/Store";
import Relation from "./util/Relation";
import Reply from "./Reply";
import Resource from "./Resource";

const query_str = (path, args) => (path ? `${path}?${querystring.encode(<any>args)}` : null);
const path_str = (query) => query.split("?")[0];

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

    const path = path_str(query);
    const state = this.store.read(query);

    if (!this.subscriptions.to(query).length) {
      this.queries.unlink(null, query);

      this.queries.link(path, query);
      state.getRefs().forEach((ref: string) => {
        this.queries.link(ref, query);
      });
    }

    this.subscriptions.link(client, query);

    client(query, state);

    return query;
  }

  static unsubscribe(client: Function, query: string = null) {
    this.subscriptions.unlink(client, query);
    if (!this.subscriptions.to(query).length) {
      this.queries.unlink(null, query);
    }
  }

  static async cache(path: string, args: object, source: Function) {
    const query = query_str(path, args);
    if (this.store.has(query)) {
      return this.store.read(query);
    }

    const result = await this.store.set(query, source);
    if (result.isError()) {
      this.store.remove(query);
    } else {
      result.__meta__.query = query; // fix
    }
    return result;
  }

  static async invalidate(path: string) {
    const queries = this.queries.from(path);

    const invalid = queries.map(async (query) => {
      const result = await this.store.reset(query);

      const subscriptions = this.subscriptions.to(query);

      if (!result.isError()) {
        subscriptions.forEach((client) => {
          client(query, result.toObject());
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
