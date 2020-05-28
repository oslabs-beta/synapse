export {};

const { Router } = require("express");
const Reply = require("./Reply");

class Controller {
  router;

  constructor() {
    this.router = Router();
  }

  declare(method: string, path: string, callback: Function) {
    this.router[method.toLowerCase()](path, (req, res) => res.send(callback, req.params));
  }

  async request(method: string, path: string, args: object = null) {
    return new Promise((resolve, reject) => {
      this.router(
        { method: method.toUpperCase(), url: path, body: args },
        {
          send: (callback, params) => resolve(callback({ ...args, ...params })),
        },
        (error) => resolve(Reply.NOT_FOUND())
      );
    });
  }
}

module.exports = Controller;
