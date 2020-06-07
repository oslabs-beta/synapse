/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import { Router } from "express";
import { parseEndpoint } from ".";
import Reply from "../Reply";

/** Generic wrapper for an ```express``` router. Associates _endpoint templates_ in the format ```METHOD /path/:param``` with handler functions. */
export default class Controller {
  /** An ```express``` router */
  router: Function;

  constructor() {
    this.router = Router();
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
   * @returns A promise that evaluates to the result of invoking the callback function associated with the provided method and path, or a ```NOT_FOUND``` {@linkcode Reply} if no matching _endpoint_ exists.
   */
  request(method: string, path: string, callback: Function): Promise<any> {
    const { method: _method } = parseEndpoint(method);

    if (!_method) {
      callback(Reply.BAD_REQUEST());
    }

    return this.router(
      { method: _method.toUpperCase(), url: path },
      { send: (result, params) => callback(result, params) },
      () => callback(Reply.NOT_FOUND())
    );
  }
}
