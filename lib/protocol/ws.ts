/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import State from "../control/State";
import Manager from "../control/Manager";
import Controller from "../control/Controller";
import { tryParseJSON, parseEndpoint } from "../utility";

/** Creates an ```express-ws``` middleware function to handle new WebSocket connections. Receives messages in the form of an object whose keys represent endpoints in the format 'METHOD /path' and whose values are objects containing the arguments to be passed to the associated endpoint.
 */
export default (callback: Function): Function => {
  // the WebSocket interface accepts two custom methods
  const customMethods = ["subscribe", "unsubscribe"];

  return (socket: any, req: any) => {
    // when a new connection is received, create a function to handle updates to that client
    const client = (path: string, state: any) => {
      const _req = {};
      const _res = {
        locals: state,
        status: () => _res,
        json: () => socket.send(JSON.stringify({ [path]: state })),
      };
      callback(_req, _res);
    };

    socket.on("message", async (msg: string) => {
      // make sure the message can be parsed to an object
      const data = tryParseJSON(msg);
      if (typeof data !== "object") {
        return client("/", State.BAD_REQUEST("Invalid Format"));
      }

      // attempt to execute each request on the object
      const requests = Object.keys(data);
      return requests.forEach(async (endpoint: string) => {
        // make sure each method is valid
        const { method, path } = parseEndpoint(endpoint, customMethods);
        if (!method) {
          return client("/", State.BAD_REQUEST("Invalid Method"));
        }

        const args = { ...req.cookies, ...data[endpoint] };

        if (method === "unsubscribe") {
          Manager.unsubscribe(client, path);
          return client(endpoint, State.OK());
        }

        if (method === "subscribe") {
          const result = await Controller.request("get", path, args);
          const { query } = result.__meta__;

          Manager.subscribe(client, query);
          return client(endpoint, result);
        }

        return client(endpoint, await Controller.request(method, path, args));
      });
    });

    // when a client disconnects, cancel all their subscriptions
    socket.on("close", () => {
      Manager.unsubscribe(client);
    });
  };
};
