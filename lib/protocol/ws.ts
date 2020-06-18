/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import * as WebSocket from "ws";
import State from "../control/State";
import Manager from "../control/Manager";
import Controller from "../control/Controller";
import { tryParseJSON, parseEndpoint } from "../utility";

/** Creates an ```express-ws``` middleware function to handle new WebSocket connections. Receives messages in the form of an object whose keys represent endpoints in the format 'METHOD /path' and whose values are objects containing the arguments to be passed to the associated endpoint.
 */
export default (callback: Function, whitelist: Array<string> = [], peers: Array<string>): Function => {
  // the WebSocket interface accepts two custom methods
  const customMethods = ["subscribe", "unsubscribe", "update"];

  const initialize = (socket: any, req: any) => {
    // when a new connection is received, determine if the client is a peer server
    const isPeer = req.isPeer || whitelist.indexOf(req.connection.remoteAddress) !== -1;

    // create a function to handle updates to that client
    const client = (path: string, state: State, render: boolean = true) => {
      if (isPeer) {
        const { ignore } = <any>state.$flags();
        if (!ignore) {
          console.log(`${path} changed -- notifying peers.`);
          socket.send(JSON.stringify({ [`UPDATE ${path}`]: {} }));
        }
      } else {
        // otherwise, return control to the express application using 'callback'
        const _req = {};
        const _res = {
          locals: state,
          status: () => _res,
          json: () => socket.send(JSON.stringify({ [path]: render ? state.render() : state })),
        };
        callback(_req, _res);
      }
    };

    if (isPeer) {
      Manager.subscribe(client);
    }

    socket.on("message", async (msg: string) => {
      // make sure the message can be parsed to an object
      const data = tryParseJSON(msg);
      if (typeof data !== "object") {
        return client("?", State.BAD_REQUEST("Invalid Format"));
      }

      // attempt to execute each request on the object
      const requests = Object.keys(data);
      return requests.forEach(async (endpoint: string) => {
        // make sure each method is valid
        const { method, path } = parseEndpoint(endpoint, customMethods);

        if (!method || (method === "update" && !isPeer)) {
          return client(endpoint, State.BAD_REQUEST("Invalid Method"));
        }

        const args = { ...req.cookies, ...data[endpoint] };

        if (method === "update") {
          console.log(msg);
          return Manager.invalidate(path, { ignore: true });
        }

        if (method === "unsubscribe") {
          Manager.unsubscribe(client, path);
          return client(endpoint, State.OK(), false);
        }

        if (method === "subscribe") {
          const state = await Controller.request("get", path, args, { method });
          Manager.subscribe(client, state.$query());
          return client(endpoint, state, false);
        }

        return client(endpoint, await Controller.request(method, path, args, { method }), false);
      });
    });

    // when a client disconnects, cancel all their subscriptions
    socket.on("close", () => {
      Manager.unsubscribe(client);
    });
  };

  peers.forEach((uri) => {
    initialize(new WebSocket(uri), { isPeer: true });
  });

  return initialize;
};
