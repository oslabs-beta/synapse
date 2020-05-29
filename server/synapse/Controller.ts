export {};

const { Router } = require("express");
const Reply = require("./Reply");

/**
 * Generic wrapper for an Express router.
 */
class Controller {
  router;

  constructor() {
    this.router = Router();
  }

  /**
   * Associates a callback function with an HTTP method and resource path
   * @param method An HTTP method
   * @param path A resource path in the Express syntax - ex. '/user/:id'
   * @param callback A callback function
   */
  declare(method: string, path: string, callback: Function) {
    this.router[method.toLowerCase()](path, (req, res) => res.send(callback, req.params));
  }

  /**
   * Attempts to execute a request using the constructed router.
   * @param method An HTTP method
   * @param path A resource path
   * @param args An object containing the arguments to be passed to the callback method, if one is found.
   * @returns A promise that evaluates to the result of invoking the callback function
   * associated with the provided method and path, or a NOT_FOUND Reply if no matching
   * endpoint exists.
   */
  async request(method: string, path: string, args: object) {
    return new Promise((resolve) => {
      this.router(
        { method: method.toUpperCase(), url: path, body: args },
        {
          send: (callback, params) => resolve(callback({ ...args, ...params })),
        },
        () => resolve(Reply.NOT_FOUND())
      );
    });
  }
}

module.exports = Controller;
