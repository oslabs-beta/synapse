export {};

const Resource = require("./Resource");
const Reply = require("./Reply");
const Manager = require("./Manager");
const Controller = require("./Controller");
const Schema = require("./Schema");
const Field = require("./Field");
const { requireAll, tryParseJSON, parseEndpoint } = require("./etc/util");

/**
 * Creates an express middleware function to handle HTTP requests
 * @param manager
 */
const http = (manager: typeof Manager) => {
  return async (req: any, res: any, next: Function) => {
    const method = req.method.toLowerCase();
    const data = { ...req.query, ...req.body, ...req.params };

    const result = await manager[method](req.path, data);

    res.status(result.status).json(result.payload);
  };
};

/**
 * Creates an express-ws middleware function to handle new WebSocket connections.
 *
 * Receives messages in the form of an object whose keys represent endpoints in
 * the format 'METHOD /path' and whose values are objects containing the arguments
 * to be passed to the associated endpoint.
 * @param manager
 */
const ws = (manager: typeof Manager) => {
  return (socket: any, req: any) => {
    // when a new connection is received, create a function to handle updates to that client
    const client = (path: string, state: any) => {
      socket.send(JSON.stringify({ [path]: state }));
    };

    socket.on("message", async (msg: string) => {
      const data = tryParseJSON(msg);

      if (typeof data !== "object") {
        return client("/", Reply.BAD_REQUEST("Invalid Format"));
      }

      // attempt to execute each request
      const requests = Object.keys(data);
      return requests.forEach(async (endpoint: string) => {
        const { method, path } = parseEndpoint(endpoint);

        if (!manager[method]) {
          return client(endpoint, Reply.BAD_REQUEST(`Invalid Method`));
        }

        const result = await manager[method](path, data[endpoint]);

        return client(endpoint, result);
      });
    });

    // when a client disconnects, cancel all their subscriptions
    socket.on("close", () => {
      manager.unsubscribe(client);
    });
  };
};

/**
 * Initializes API request handlers from Resource definitions in the given directory 'dir'.
 * @param dir A directory containing Resource definitions.
 * @returns An object containing properties 'ws' and 'http', whose values are request handlers for the respective protocol.
 */
function synapse(dir: string) {
  const controller = new Controller();
  const manager = new Manager((...args) => {
    return controller.request(...args);
  });

  requireAll(dir).forEach((Class: any) => {
    if (Class && Class.prototype instanceof Resource) {
      Class.attach(controller, manager);
    }
  });

  return {
    http: http(manager),
    ws: ws(manager),
  };
}

Object.assign(synapse, { Field, Schema, Resource, Reply, Controller, Manager });

module.exports = synapse;
