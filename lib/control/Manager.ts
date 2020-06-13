/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */

import Cache from "../utility/Cache";
import State from "./State";
import Relation from "../utility/Relation";
import Operation from "./Operation";
import { routeToPath } from "../utility";

/** Represents an instance of an API server. Acts as an abstraction layer between network protocols and resource business logic. Manages caching, subscription, and state management of resources. */
export default class Manager extends Cache {
  /** Maps _resource paths_ to _query strings_. */
  static dependents: Relation<string, string> = new Relation();

  /** Maps clients (represented by callback functions) to _query strings_ and vice versa. */
  static subscriptions: Relation<Function, string> = new Relation();

  static remove(query: string) {
    super.remove(query);

    this.dependents.unlink(null, query);

    this.subscriptions.to(query).forEach((client) => {
      this.unsubscribe(client, query);
      client(query, null);
    });
  }

  static async set(query: string, source: Function = null) {
    const state: State = await super.set(query, source);

    if (state.isError()) {
      this.remove(query);
      return state;
    }

    this.dependents.unlink(null, query);
    state.dependencies().forEach((path: string) => {
      this.dependents.link(path, query);
    });

    this.subscriptions.to(query).forEach((client) => {
      client(query, state);
    });

    return state;
  }

  static async execute(op: Operation, args: object) {
    const query = routeToPath(op.path, args, true);

    if (op.isRead()) {
      if (this.has(query)) {
        return this.get(query);
      }

      return this.set(query, async () => {
        const state = await op(args);
        state.query(query);
        return state;
      });
    }

    const state = await op(args);
    state.query(query);

    op.dependents.forEach((path) => {
      const queries = this.dependents.from(path);
      queries.forEach(async (_query) => this.set(_query));
    });
    return state;
  }

  static subscribe(client: Function, query: string) {
    if (!this.has(query)) {
      return false;
    }

    this.subscriptions.link(client, query);
    return true;
  }

  static unsubscribe(client: Function, query: string = null) {
    this.subscriptions.unlink(client, query);
  }
}
