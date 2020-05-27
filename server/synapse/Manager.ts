export {};

const runMiddleware = require("run-middleware");

class Manager {
  cache: Map<string, any>;

  dependents: Map<string, Array<any>>;

  subscriptions: Map<Function, Array<any>>;

  generator: Function;

  constructor(router) {
    this.cache = new Map();
    this.dependents = new Map();
    this.subscriptions = new Map();

    runMiddleware(router);
    this.generator = async (method, path, data) => {
      return new Promise((resolve, reject) => {
        try {
          router.runMiddleware(path, { method, body: data }, (status, body, cookies) => {
            resolve({ status, body, cookies });
          });
        } catch (err) {
          reject(err);
        }
      });
    };
  }

  /**
   * Subscribes a client to a given resource path.
   * Subscriptions are many-to-many relationships between clients and resources.
   * Client-to-resource associations are stored in Manager.prototype.subscriptions.
   * Resource-to-client associations are stored in Manager.prototype.dependents.
   * @param client A function representing the client that requested the resource. Will be invoked when teh resource changes state.
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

  update(resource) {
    const dependents = this.dependents.get(resource);
    if (dependents) {
      dependents.forEach((client) => {});
    }
  }

  get(path, data, client = null) {
    return this.generator("get", path, data);
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