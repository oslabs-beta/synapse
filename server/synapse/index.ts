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
const http = (manager: Manager): Function => {
  return async (req: any, res: any, next: Function) => {
    const { method } = parseEndpoint(req.method);

    // make sure the request is allowed
    if (!method) {
      return res.status(405).send("Method Not Allowed");
    }

    // then pass it to the manager
    const args = {
      ...req.cookies,
      ...req.query,
      ...req.body,
      ...req.params,
    };
    const result = await manager[method](req.path, args);

    res.status(result.status).json(result.payload);
  };
};

/** Creates an express-ws middleware function to handle new WebSocket connections. Receives messages in the form of an object whose keys represent endpoints in the format 'METHOD /path' and whose values are objects containing the arguments to be passed to the associated endpoint.
 * @param manager
 */
const ws = (manager: Manager): Function => {
  // the WebSocket interface accepts two custom methods
  const customMethods = ["subscribe", "unsubscribe"];

  return (socket: any, req: any) => {
    // when a new connection is received, create a function to handle updates to that client
    const client = (path: string, state: any) => {
      socket.send(JSON.stringify({ [path]: state }));
    };

    socket.on("message", async (msg: string) => {
      // make sure the message can be parsed to an object
      const data = tryParseJSON(msg);
      if (typeof data !== "object") {
        return client("/", Reply.BAD_REQUEST("Invalid Format"));
      }

      // attempt to execute each request on the object
      const requests = Object.keys(data);
      return requests.forEach(async (endpoint: string) => {
        // make sure the method is valid
        const { method, path } = parseEndpoint(endpoint, customMethods);

        if (!method) {
          return client("/", Reply.BAD_REQUEST("Invalid Method"));
        }

        // SUBSCRIBE and UNSUBSCRIBE requests are handled separately...
        if (customMethods.includes(method)) {
          return client(endpoint, await manager[method](client, path));
        }

        // ...from the standard HTTP methods
        const args = { ...req.cookies, ...data[endpoint] };
        return client(endpoint, await manager[method](path, args));
      });
    });

    // when a client disconnects, cancel all their subscriptions
    socket.on("close", () => {
      manager.unsubscribe(client);
    });
  };
};

/**
 * Creates an express middleware function to handle requests for SSE subscriptions (simply GET requests with the appropriate headers set).
 * @param manager
 */
const sse = (manager: Manager): Function => {
  return async (req: any, res: any, next: Function) => {
    // Since a request for SSE constitutes a request for a subscription
    const { method } = parseEndpoint(req.method);

    // only a get request will be allowed.
    if (method !== "get") {
      return res.status(400).send("Invalid Method");
    }

    // create a function to handle updates to the client
    const client = (path: string, state: any) => {
      res.write(`data: ${JSON.stringify({ [path]: state })}\n\n`);
    };

    // validate the request by attempting to GET the requested resource
    const args = {
      ...req.cookies,
      ...req.query,
      ...req.body,
      ...req.params,
    };
    const result = await manager.get(req.path, args);

    if (result.isError()) {
      return res.status(result.status).send(result.payload);
    }

    // if the resource is valid, subscribe the client
    manager.subscribe(client, req.path);

    // upgrade the connection
    const headers = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };
    res.set(headers).status(200);

    // and send back the result of the initial request
    return client(`${req.method} ${req.path}`, result);
  };
};

/**
 * Initializes API request handlers from {@linkcode Resource} definitions in the given ```directory```.
 * @param directory A directory containing {@linkcode Resource} definitions.
 * @returns An object containing properties ```ws```, ```http```, and ```sse```, whose values are request handlers for the respective protocol.
 */
export function initialize(directory: string): object {
  const controller = new Controller();

  const manager = new Manager((method, path, data) => {
    return controller.request(method, path, data);
  });

  requireAll(directory).forEach((module: any) => {
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
