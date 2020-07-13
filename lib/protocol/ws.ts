/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import * as WebSocket from 'ws';
import State from '../State';
import Router from '../control/Router';
import Manager from '../control/Manager';
import { tryParseJSON, parseEndpoint } from '../utility';

/** Creates an ```express-ws``` middleware function to handle new WebSocket connections. Receives messages in the form of an object whose keys represent endpoints in the format 'METHOD /path' and whose values are objects containing the arguments to be passed to the associated endpoint.
 */
export default (
  router: Router,
  callback: Function,
  accept: Array<string> | Promise<Array<string>> = [],
  join: Array<string> | Promise<Array<string>> = []
): Function => {
  // the WebSocket interface accepts two custom methods
  const customMethods = ['subscribe', 'unsubscribe'];

  const newPeer = (socket: any) => {
    const listener = (paths: string | Array<string>) => {
      console.log(`${paths} changed -- notifying peers.`);
      socket.send(JSON.stringify({ UPDATE: paths }));
    };

    Manager.listen(listener);

    socket.on('message', (msg: string) => {
      console.log(msg);

      // make sure the message can be parsed to an object
      const data = tryParseJSON(msg);
      if (typeof data !== 'object') {
        return;
      }

      // attempt to execute each request on the object
      Object.entries(data).forEach(([method, args]) => {
        method = method.toLowerCase();

        if (method === 'update' && (typeof args === 'string' || Array.isArray(args))) {
          return Manager.invalidate(args, true);
        }

        return null;
      });
    });

    socket.on('close', () => {
      Manager.unlisten(listener);
    });
  };

  const newClient = (socket: any, req: any) => {
    // create a function to handle updates to that client
    const client = (path: string, state: State, render: boolean = true) => {
      const _req = {};
      const _res = {
        locals: state,
        stream: (data: State) => socket.send(JSON.stringify({ [path]: render ? data.render() : data })),
      };
      callback(_req, _res);
    };

    socket.on('message', async (msg: string) => {
      // make sure the message can be parsed to an object
      const data = tryParseJSON(msg);
      if (typeof data !== 'object') {
        return client('?', State.BAD_REQUEST('Invalid Format'));
      }

      // attempt to execute each request on the object
      const requests = Object.keys(data);
      return requests.forEach(async (endpoint: string) => {
        // make sure each method is valid
        const { method, path } = parseEndpoint(endpoint, customMethods);

        if (!method) {
          return client(endpoint, State.BAD_REQUEST('Invalid Method'));
        }

        const args = { ...req.cookies, ...data[endpoint] };

        if (method === 'unsubscribe') {
          Manager.unsubscribe(client, path);
          return client(endpoint, State.OK(), false);
        }

        if (method === 'subscribe') {
          const state = await router.request('get', path, args);
          Manager.subscribe(client, state.$query);
          return client(endpoint, state, false);
        }

        return client(endpoint, await router.request(method, path, args), false);
      });
    });

    // when a client disconnects, cancel all their subscriptions
    socket.on('close', () => {
      Manager.unsubscribe(client);
    });
  };

  Promise.resolve(accept).then((ips) => {
    accept = ips;
  });

  Promise.resolve(join).then((peers) => {
    peers.forEach((uri) => {
      newPeer(new WebSocket(uri));
    });
  });

  return (socket: any, req: any) => {
    // when a new connection is received, determine if the client is a peer server
    if (Array.isArray(accept) && accept.indexOf(req.connection.remoteAddress) !== -1) {
      return newPeer(socket);
    }

    return newClient(socket, req);
  };
};
