/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import * as express from "express";
import State from "../control/State";
import { parseEndpoint } from ".";

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

  /** Associates a callback function with an HTTP method and _resource path_
   * @param method An HTTP method
   * @param path A _route_ in the ```express``` syntax (e.g ```/user/:id```)
   * @param callback A callback function
   */
  declare(method: string, path: string, callback: Function): void {
    const { method: _method } = parseEndpoint(method);

    if (!_method) {
      throw new Error(`Unkown method '${method}'.`);
    }

    this.router[_method](path, (req, res) => res.send(callback, req.params));
  }

  /** _**(async)**_ Attempts to execute a request using the constructed router.
   * @param method An HTTP method
   * @param path A _resource path_
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

  async getOptions(path: string) {
    return new Promise((resolve) => {
      return this.router(
        { method: "OPTIONS", url: path },
        { set: () => {}, send: (options) => resolve(options.split(",")) },
        () => resolve(State.NOT_FOUND())
      );
    });
  }
}
