/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import * as express from 'express';
import State from '../State';
import { parseEndpoint } from '../utility';

/** Generic wrapper for an ```express``` router. Associates _endpoint templates_ in the format ```METHOD /path/:param``` with handler functions. */
export default class Router {
  /** An ```express``` router */
  router: Function;

  transform: Function;

  constructor(transform: Function = null) {
    this.router = express.Router();

    this.transform =
      transform || ((path, params, ...args) => [{ ...args.shift(), ...params }, path, ...args]);
  }

  /** Associates a callback function with an HTTP method and _route_.
   * @param method An HTTP method
   * @param route A _route_ in the ```express``` syntax (e.g ```/user/:id```)
   * @param callback A callback function
   */
  declare(method: string, route: string, callback: Function | Router): void {
    if (!this.router[method]) {
      throw new Error(`Unkown method '${method}'.`);
    }

    const handler =
      callback instanceof Router ? callback.router : (req, res) => res.send(callback, req.params);

    this.router[method](route, handler);
  }

  /** _**(async)**_ Attempts to execute a request using the constructed router.
   * @param method An HTTP method.
   * @param path A _path_ string.
   * @param args An object containing the arguments to be passed to the callback method, if one is found.
   * @returns A promise that evaluates to the result of invoking the callback function associated with the provided method and path, or a ```NOT_FOUND``` {@linkcode State} if no matching _endpoint_ exists.
   */
  async request(method: string, path: string, ...args: Array<any>): Promise<any> {
    return new Promise((resolve) => {
      const { method: _method } = parseEndpoint(method);

      if (!_method) {
        resolve(State.BAD_REQUEST());
      }

      return this.router(
        { method: _method.toUpperCase(), url: path },
        { send: (callback, params) => resolve(callback(...this.transform(path, params, ...args))) },
        () => resolve(State.NOT_FOUND())
      );
    });
  }

  /** _**(async)**_ Returns a promise resolving to either: 1) an array containing all HTTP methods available at the given ```path```, or 2) a ```NOT_FOUND``` error.
   * @param path A _path_ string.
   */
  async options(path: string): Promise<Array<string> | State> {
    return new Promise((resolve) => {
      return this.router(
        { method: 'OPTIONS', url: path },
        { set: () => {}, send: (options) => resolve(options.split(',')) },
        () => resolve(State.NOT_FOUND())
      );
    });
  }
}
