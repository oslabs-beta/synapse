/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */

import Resource from "./Resource";
import Reply from "./Reply";
import Manager from "./Manager";
import Controller from "./Controller";
import { requireAll, tryParseJSON, parseEndpoint } from "./util";

/**
 * Creates an express middleware function to handle HTTP requests
 * @param manager
 */
const http = (manager: Manager) => {
  return async (req: any, res: any, next: Function) => {
    const { method } = parseEndpoint(req.method);

    let result;
    if (method) {
      result = await manager[method](req.path, {
        ...req.query,
        ...req.body,
        ...req.params,
      });
    } else {
      result = Reply.BAD_REQUEST("Invalid Method");
    }

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
const ws = (manager: Manager) => {
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
        const customMethods = ["subscribe", "unsubscribe"];
        const { method, path } = parseEndpoint(endpoint, customMethods);

        if (!method) {
          return client("/", Reply.BAD_REQUEST("Invalid Method"));
        }

        if (customMethods.includes(method)) {
          return client(endpoint, await manager[method](client, path));
        }

        return client(endpoint, await manager[method](path, data[endpoint]));
      });
    });

    // when a client disconnects, cancel all their subscriptions
    socket.on("close", () => {
      manager.unsubscribe(client);
    });
  };
};

/**
 * Creates an express middleware function to handle requests for SSE subscriptions
 * @param manager
 */
const sse = (manager: Manager) => {
  return async (req: any, res: any, next: Function) => {
    // handle sse request
  };
};

/**
 * Initializes API request handlers from Resource definitions in the given directory 'dir'.
 * @param dir A directory containing Resource definitions.
 * @returns An object containing properties 'ws' and 'http', whose values are request handlers for the respective protocol.
 */
export function initialize(dir: string) {
  const controller = new Controller();

  const manager = new Manager((method, path, data) => {
    return controller.request(method, path, data);
  });

  requireAll(dir).forEach((module: any) => {
    const Class = module.default;
    if (Class && Class.prototype instanceof Resource) {
      Class.attach(controller, manager);
    }
  });

  return {
    http: http(manager),
    sse: sse(manager),
    ws: ws(manager),
  };
}

export { default as Field } from "./Field";
export { default as Schema } from "./Schema";
export { default as Resource } from "./Resource";
export { default as Reply } from "./Reply";
export { default as Controller } from "./Controller";
export { default as Manager } from "./Manager";
