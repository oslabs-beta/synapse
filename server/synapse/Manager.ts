export {};

const Reply = require("./Reply");

const Controller = require("./Controller");

class Manager {
  /**
   * Maps resources by paths to their last known values.
   */
  cache: Map<string, any>;

  /**
   * Maps resources by path to subscribers (clients). Clients are represented by callback functions.
   */
  dependents: Map<string, Array<Function>>;

  /**
   * Maps clients (represented by callback functions) to subscriptions (resource paths).
   */
  subscriptions: Map<Function, Array<string>>;

  /**
   * The function which will be invoked to to execute requests when a cached resource is invalidated or unavailable.
   */
  generator: Function;

  /**
   * @param generator Function which will fulfill uncached requests.
   */
  constructor(controller: typeof Controller) {
    this.cache = new Map();
    this.dependents = new Map();
    this.subscriptions = new Map();
    this.generator = (...args) => controller.request(...args);
  }

  /**
   * Subscribes a client to a given resource path.
   * Subscriptions are many-to-many relationships between clients and resources.
   * Client-to-resource associations are stored in Manager.prototype.subscriptions.
   * Resource-to-client associations are stored in Manager.prototype.dependents.
   * @param client A function representing the client that requested the resource. Will be invoked when the resource changes state.
   * @param path A resource path
   */
  subscribe(client: Function, path: string) {
    if (!this.subscriptions.has(client)) {
      this.subscriptions.set(client, []);
    }
    if (!this.dependents.has(path)) {
      this.dependents.set(path, []);
    }
    const dependents = this.dependents.get(path);
    dependents.push(client);
    const subscriptions = this.subscriptions.get(client);
    subscriptions.push(path);
  }

  /**
   * Removes all associations between a given client and a given resource path.
   * If no path is specified, unsubscribes the client from all resources.
   * @param client A function representing a client.
   * @param path A resource path.
   */
  unsubscribe(client: Function, path: string = null) {
    const subscriptions = this.subscriptions.get(client);
    const remove = path ? [path] : subscriptions;
    remove.forEach((target) => {
      const i = subscriptions.indexOf(target);
      if (i !== -1) {
        subscriptions.splice(i, 1);
      }

      const dependents = this.dependents.get(target);
      const j = dependents.indexOf(client);
      if (j !== -1) {
        dependents.splice(j, 1);
      }
    });
  }

  /**
   * Recalculates the cached value of a given resource.
   * Invokes all subscriber functions with the new value.
   * @param path A resource path
   * @returns The new value of the resource.
   */

  async update(path: string) {
    this.cache[path] = await this.generator("get", path);
    if (this.dependents[path] !== undefined && this.dependents[path].length) {
      this.dependents[path].forEach((client) => {
        client({ path: this.cache[path] });
      });
    }
    if (this.cache[path] instanceof Reply && this.cache[path].status === 404) {
      this.dependents[path].forEach((client) => {
        this.unsubscribe(client, path);
      });
      this.cache.delete(path);
    }
    return this.cache[path];
  }

  async get(path, data, client = null) {
    if (client) {
      this.subscribe(client, path);
    }
    if (this.cache[path]) {
      return this.cache[path];
    }
    this.cache[path] = await this.generator("get", path);
    return this.cache[path];
  }

  async post(path, data, client = null) {
    if (client) {
      this.subscribe(client, path);
    }
    const result = await this.generator("post", path, data);
    this.update(path);
    return result;
  }

  // put - user sends entire new object to use instead ex{ name: denis, email: newemail}
  // instead of {name dennis; email old email}

  async put(path, data, client = null) {
    if (client) {
      this.subscribe(client, path);
    }
    const result = await this.generator("put", path, data);
    this.update(path);
    return result;
  }

  // patch - only changes the given key
  // ex {email: new email}
  // wont erase other properties.args
  async patch(path, data, client = null) {
    if (client) {
      this.subscribe(client, path);
    }
    const result = await this.generator("patch", path, data);
    this.update(path);
    return result;
  }

  async delete(path) {
    await this.generator("delete", path, null);
    this.update(path);
  }
}

module.exports = Manager;
