/* eslint-disable no-param-reassign */
// eslint-disable-next-line import/extensions
import Relation from "./etc/Relation";

const Reply = require("./Reply");
const Resource = require("./Resource");

class Manager {
  /**
   * Maps resources by paths to their last known values.
   */
  cache: object;

  /**
   * Stores the resource paths waiting to be updated.
   */
  queue: Array<string>;

  /**
   * Maps clients (represented by callback functions) to resource paths and vice versa.
   */
  subscriptions: Relation<Function, string>;

  /**
   * The function which will be invoked to to execute requests when a cached resource is invalidated or unavailable.
   */
  generator: Function;

  /**
   * @param generator A function f(method, path, args)
   */
  constructor(generator: Function) {
    this.cache = {};
    this.queue = [];
    this.subscriptions = new Relation();
    this.generator = generator;
  }

  /**
   * Subscribes a client to a given resource path.
   * Subscriptions are many-to-many relationships between clients and resources.
   * Client-to-resource associations are stored in Manager.prototype.subscriptions.
   * Resource-to-client associations are stored in Manager.prototype.dependents.
   * @param client A function representing the client that requested the resource. Will be invoked when the resource changes state.
   * @param path A resource path
   */
  async subscribe(client: Function, path: string) {
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
      state.forEach((resource: typeof Resource) => {
        this.subscribe(client, resource.address());
      });
    }

    // then send the resource state to the client
    // client(path, state);

    // finally, respond to the request
    return Reply.OK();
  }

  /**
   * Removes all associations between a given client and a given resource path.
   * If no path is specified, unsubscribes the client from all resources.
   * @param client A function representing a client.
   * @param path A resource path.
   */
  unsubscribe(client: Function, path: string = null) {
    this.subscriptions.unlink(client, path);

    // if the unsubscribed resource is a collection
    const state = this.cache[path];
    if (Array.isArray(state)) {
      // unsubscribe the client from all resources in the collection as well
      state.forEach((resource: typeof Resource) => {
        this.subscriptions.unlink(client, resource.path());
      });
    }

    return Reply.OK();
  }

  /**
   * Recalculates the cached value of a given resource by making a GET request to the generator.
   * Invokes all subscriber functions with the new value.
   * @param path A resource path
   * @returns The result of the GET request
   */
  async update(path: string) {
    // if there are resources in the queue, then there is already an active update cycle
    if (this.queue.length) {
      // add the path the to queue and return;
      return this.queue.push(path);
    }

    // otherwise, add the resource to the queue and begin an update cycle
    this.queue.push(path);

    while (this.queue.length) {
      // otherwise, start by getting the current state of the resource from the generator
      const curPath = this.queue[0];
      // eslint-disable-next-line no-await-in-loop
      const result = await this.generator("get", curPath);

      if (!result.isError()) {
        // if it's not an error, update the cache and send the new state to all subscribers
        this.cache[curPath] = result.payload;
        this.subscriptions.to(curPath).forEach((client) => {
          client(curPath, result.payload);
        });
      } else if (result.status === 404) {
        // otherwise, if the resource was not found, remove the resource from the cache
        delete this.cache[curPath];
        // then unsubscribe all subscribers and alert them with the new state (undefined).
        this.subscriptions.to(curPath).forEach((client) => {
          this.unsubscribe(client, curPath);
          client(curPath, undefined);
        });
      }

      this.queue.shift();
    }

    return undefined;
  }

  async get(path, data = {}) {
    if (this.cache[path]) {
      return Reply.OK(this.cache[path]);
    }

    const result = await this.generator("get", path, data);

    if (!result.isError()) {
      this.cache[path] = result.payload;
    }

    return result;
  }

  async post(path, data = {}) {
    const result = await this.generator("post", path, data);
    if (!result.isError()) {
      this.update(path);
    }
    return result;
  }

  async put(path, data) {
    const result = await this.generator("put", path, data);
    if (!result.isError()) {
      this.update(path);
    }
    return result;
  }

  async patch(path, data) {
    const result = await this.generator("patch", path, data);
    if (!result.isError()) {
      this.update(path);
    }
    return result;
  }

  async delete(path) {
    const result = await this.generator("delete", path, null);
    if (!result.isError()) {
      this.update(path);
    }
    return result;
  }
}

module.exports = Manager;
