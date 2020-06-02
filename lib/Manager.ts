/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import Store from "./util/Store";
import Relation from "./util/Relation";
import Reply from "./Reply";
import Resource from "./Resource";

/** Represents an instance of an API server. Acts as an abstraction layer between network protocols and resource business logic. Manages caching, subscription, and state management of resources. */
export default class Manager {
  /** Maps resources by paths to their last known values. */
  cache: Store;

  /** Stores the resource paths waiting to be updated. */
  queue: Array<string>;

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
    this.subscriptions = new Relation();
    this.generator = generator;
  }

  /** _**(async)**_ Subscribes a client function to a given _resource ```path```_.
   * @param client A function representing a client. Will be invoked when the resource at ```path``` changes state.
   * @param path A _resource path_.
   * @returns A promise evaluating to a {@linkcode Reply} -- ```OK``` if the subscription was successful, otherwise the reply returned by a ```GET``` request to the _resource path_.
   */
  async subscribe(client: Function, path: string): Promise<Reply> {
    // first attempt to get the value of the resource
    const result = await this.get(path);

    // if the resource's value can't be obtained, it can't be subscribed to
    if (result.isError()) {
      return result;
    }

    // otherwise, store the subscription
    this.subscriptions.link(client, path);

    // the resource state will always be either an instance of Resource or an array of Resource instances
    const state = result.payload;

    // if it's an array, subscribe the client to each resource in the collection
    if (Array.isArray(state)) {
      state.forEach((resource: Resource) => {
        this.subscribe(client, resource.path());
      });
    }

    // then send the resource state to the client
    // client(path, state);

    // finally, respond to the request
    return Reply.OK();
  }

  /** Unsubscribes a client function from a given _resource ```path```_. If no path is specified, unsubscribes the client from all resources.
   * @param client A function representing a client.
   * @param path A _resource path_.
   * @returns An ```OK``` {@linkcode Reply}.
   */
  unsubscribe(client: Function, path: string = null): Reply {
    this.subscriptions.unlink(client, path);

    // if the unsubscribed resource is a collection
    const state = this.cache.get(path);
    if (Array.isArray(state)) {
      // unsubscribe the client from all resources in the collection as well
      state.forEach((resource: Resource) => {
        this.subscriptions.unlink(client, resource.path());
      });
    }

    return Reply.OK();
  }

  /** Indicates that the resources at the specified ```paths``` may have changed state.
   * @param paths One or more _resource paths_.
   */
  notify(...paths: Array<string>): void {
    this.queue.push(...paths);
  }

  /** _**(async)**_ Recalculates the cached value of a given resource by making a GET request to the generator. Invokes all subscribed client functions with the new state.
   * @param path A _resource path_.
   * @returns A reply representing the result of the GET request used to recalculate the resource state.
   */
  async update(): Promise<Reply> {
    // update all affected resources in order
    while (this.queue.length) {
      const path = this.queue.shift();

      const subscriptions = this.subscriptions.to(path);
      if (subscriptions.length) {
        // start by getting the current state of the resource from the generator
        // eslint-disable-next-line no-await-in-loop
        const result = await this.generator("get", path);

        if (!result.isError()) {
          // if it's not an error, update the cache and send the new state to all subscribers
          this.cache.set(path, result.payload);
          subscriptions.forEach((client) => {
            client(path, result.payload);
          });
        } else if (result.status === 404) {
          // otherwise, if the resource was not found, remove the resource from the cache
          this.cache.delete(path);
          // then unsubscribe all subscribers and alert them with the new state (undefined).
          subscriptions.forEach((client) => {
            this.unsubscribe(client, path);
            client(path, undefined);
          });
        }
      }
    }

    return undefined;
  }

  /** _**(async)**_ Returns the current state of the resource at the specified ```path```. Uses the cached value when available, otherwise makes a ```GET``` request to the {@linkcode Manager.generator|generator}.
   * @param path A _resource path_.
   * @param data The arguments to be passed to the _endpoint_ method.
   * @returns A promise evaluating to a {@linkcode Reply}.
   */
  async get(path: string, data: object = {}): Promise<Reply> {
    if (this.cache.has(path)) {
      return Reply.OK(this.cache.get(path));
    }

    const result = await this.generator("get", path, data);

    if (!result.isError()) {
      this.cache.set(path, result.payload);
    }

    return result;
  }

  /** _**(async)**_ Makes a ```POST ``` request to the {@linkcode Manager.generator|generator}.
   * @param path A _resource path_.
   * @param data The arguments to be passed to the _endpoint_ method.
   * @returns A promise evaluating to the result of the request.
   */
  async post(path: string, data: object): Promise<Reply> {
    this.notify(path);
    const result = await this.generator("post", path, data);
    if (!result.isError()) {
      this.update();
    }
    return result;
  }

  /** _**(async)**_ Makes a ```PUT ``` request to the {@linkcode Manager.generator|generator}.
   * @param path A _resource path_.
   * @param data The arguments to be passed to the _endpoint_ method.
   * @returns A promise evaluating to the result of the request.
   */
  async put(path: string, data: object): Promise<Reply> {
    this.notify(path);
    const result = await this.generator("put", path, data);
    if (!result.isError()) {
      this.update();
    }
    return result;
  }

  /** _**(async)**_ Makes a ```PATCH ``` request to the {@linkcode Manager.generator|generator}.
   * @param path A _resource path_.
   * @param data The arguments to be passed to the _endpoint_ method.
   * @returns A promise evaluating to the result of the request.
   */
  async patch(path: string, data: object): Promise<Reply> {
    this.notify(path);
    const result = await this.generator("patch", path, data);
    if (!result.isError()) {
      this.update();
    }
    return result;
  }

  /** _**(async)**_ Makes a ```DELETE ``` request to the {@linkcode Manager.generator|generator}.
   * @param path A _resource path_.
   * @param data The arguments to be passed to the _endpoint_ method.
   * @returns A promise evaluating to the result of the request.
   */
  async delete(path: string): Promise<Reply> {
    this.notify(path);
    const result = await this.generator("delete", path, null);
    if (!result.isError()) {
      this.update();
    }
    return result;
  }
}
