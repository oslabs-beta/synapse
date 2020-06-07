/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable no-lone-blocks */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import * as querystring from "querystring";
import Store from "./util/Store";
import Relation from "./util/Relation";
import Reply from "./Reply";
import Resource from "./Resource";

const queryString = (path, args) => (path ? `${path}?${querystring.encode(<any>args)}` : null);

const analyze = (query: string, state: any, target: Relation<string, string>) => {
  const [path] = query.split("?");

  target.unlink(null, query);

  target.link(path, query);
  (Array.isArray(state) ? state : [state]).forEach((resource: Resource) => {
    target.link(resource.path(), query);
  });
};

/** Represents an instance of an API server. Acts as an abstraction layer between network protocols and resource business logic. Manages caching, subscription, and state management of resources. */
export default class Manager {
  cache: Store;

  /** Stores the _resource paths_ waiting to be updated. */
  queue: Array<string>;

  /** Maps _resource paths_ to query strings. */
  queries: Relation<string, string>;

  /** Maps clients (represented by callback functions) to _resource paths_ and vice versa. */
  subscriptions: Relation<Function, string>;

  /** The function ```(method, path, args) => {...}``` which will be invoked to execute requests when a cached resource is invalidated or unavailable. */
  generator: Function;

  /**
   * @param generator See {@linkcode Manager.generator|Manager.prototype.generator}.
   */
  constructor(generator: Function) {
    this.cache = new Store();
    this.queue = [];
    this.queries = new Relation();
    this.subscriptions = new Relation();
    this.generator = generator;
  }

  /** Unsubscribes a client function from a given _resource ```path```_. If no path is specified, unsubscribes the client from all resources.
   * @param client A function representing a client.
   * @param path A _resource path_.
   * @returns An ```OK``` {@linkcode Reply}.
   */
  unsubscribe(client: Function, query: string = null): Reply {
    this.subscriptions.unlink(client, query);
    return Reply.OK();
  }

  /** Indicates that the resources at the specified ```paths``` may have changed state.
   * @param paths One or more _resource paths_.
   */
  notify(...paths: Array<string>): void {
    this.queue.push(...paths);
  }

  /** _**(async)**_ Recalculates state of all invalidated resources and sends new state to all subscribers. */
  async update(): Promise<Reply> {
    while (this.queue.length) {
      for (const query of this.queries.from(this.queue.shift())) {
        const subscriptions = this.subscriptions.to(query);

        if (subscriptions.length) {
          const [path, args] = query.split("?");
          const result = await this.read(query, true);
          const state = result.payload;

          if (!result.isError()) {
            subscriptions.forEach((client) => {
              client(path, state);
            });
          } else if (result.status === 404) {
            subscriptions.forEach((client) => {
              this.unsubscribe(client, path);
              client(path, null);
            });
          }
        }
      }
    }

    return undefined;
  }

  async read(query: string, force: boolean = false) {
    const [path] = query.split("?");

    if (!path) return;

    let result;
    if (force || !this.cache.has(query)) {
      result = await this.generator(path, query);
    } else {
      result = Reply.OK(this.cache.get(query));
    }

    if (!(result instanceof Reply)) {
      result = Reply.INTERNAL_SERVER_ERROR();
    }

    if (result.isError()) {
      this.cache.delete(query);
      return result;
    }

    const state = result.payload;
    this.cache.set(query, state);

    if (this.subscriptions.to(query).length) {
      analyze(query, state, this.queries);
    }

    return result;
  }

  async execute(path: string, request: Array<any>, client: Function = null) {
    const { queue } = this;
    this.queue = [];

    let result = await this.generator(path, request);

    if (typeof result === "string") {
      const query = result;

      result = await this.read(query);

      const state = result.payload;
      if (client && !result.isError()) {
        if (!this.subscriptions.to(query).length) {
          analyze(query, state, this.queries);
        }

        this.subscriptions.link(client, query);
        client(path, state);
        result = Reply.OK(query);
      }

      return result;
    }

    if (!(result instanceof Reply)) {
      result = Reply.INTERNAL_SERVER_ERROR();
    }

    if (!result.isError()) {
      this.queue = [...queue, path, ...this.queue];
      if (!queue.length) {
        this.update();
      }
    }

    return result;
  }

  async ex(path: string, request: Array<any>, client: Function = null) {
    const { queue } = this;
    this.queue = [];

    let result = await this.generator(path, request);

    let query = null;
    if (typeof result === "string") {
      query = result; // read request
      if (this.cache.has(query)) {
        result = Reply.OK(this.cache.get(query));
      } else {
        result = await this.generator(path, query);
      }
    }

    if (!(result instanceof Reply)) {
      result = Reply.INTERNAL_SERVER_ERROR();
    }

    if (result.isError()) {
      this.cache.delete(query);
      return result;
    }

    if (query) {
      const state = result.payload;
      this.cache.set(query, state);

      if (client) {
        this.subscriptions.link(client, query);
        client(path, state);
        result = Reply.OK(query);
      }

      if (this.subscriptions.to(query).length) {
        this.queries.link(path, query);
        (Array.isArray(state) ? state : [state]).forEach((resource: Resource) => {
          this.queries.link(resource.path(), query);
        });
      }
    } else {
      // write request
      this.queue = [...queue, path, ...this.queue];
      if (!queue.length) {
        this.update();
      }
    }

    return result;
  }
}
