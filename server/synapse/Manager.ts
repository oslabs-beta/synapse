export {};

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
   * @param router An Express router which will handle uncached requests.
   */
  constructor(generator: Function) {
    this.cache = new Map();
    this.dependents = new Map();
    this.subscriptions = new Map();
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
  update(path: string) {}

  async get(path, data, client = null) {
    this.cache[path] = await this.generator("get", path, data);
    return this.cache[path];
  }

  post(path, data, client = null) {
    return this.generator("post", path, data);
  }

  put(path, data, client = null) {
    return this.generator("put", path, data);
  }

  patch(path, data, client = null) {
    return this.generator("patch", path, data);
  }

  delete(path, data, client = null) {
    return this.generator("delete", path, data);
  }
}

module.exports = Manager;
