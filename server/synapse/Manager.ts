class Manager {
  generator: Function;

  cache: Map<string, any>;

  dependents: Map<string, Array<any>>;

  subscriptions: Map<any, Array<any>>;

  constructor(generator: Function) {
    this.generator = generator;
    this.cache = new Map();
    this.dependents = new Map();
    this.subscriptions = new Map();
  }

  subscribe(client: any, resource: string) {
    if (!this.subscriptions.has(client)) {
      this.subscriptions.set(client, []);
    }
    if (!this.dependents.has(resource)) {
      this.dependents.set(resource, []);
    }
    const dependents = this.dependents.get(resource);
    dependents.push(client);
    const subscriptions = this.subscriptions.get(resource);
    subscriptions.push(resource);
  }

  unsubscribe(client: any, resource: string = null) {
    const subscriptions = this.subscriptions.get(client);
    const remove = resource ? [resource] : subscriptions;
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

  /**
   * Handles a request to the API.
   * For
   * @param endpoint the request to execute - ex. GET /user/123
   * @param client the client who will be subscribed to the requested resource, if provided
   */
  request(endpoint: string, client: any = null) {}
}
