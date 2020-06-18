/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import Controller from "../control/Controller";
import { parseEndpoint } from "../utility";
import State from "../control/State";

/**
 * Creates an ```express``` middleware function to handle HTTP requests
 */
export default (callback: Function): Function => {
  return async (req: any, res: any) => {
    const { method } = parseEndpoint(req.method);

    let result;
    if (method === "options") {
      const options = await Controller.router.getOptions(req.path);
      if (Array.isArray(options)) {
        res.set("Allow", options.join(","));
        result = State.NO_CONTENT();
      }
    } else {
      const args = { ...req.cookies, ...req.query, ...req.body, ...req.params };
      result = await Controller.request(method, req.path, args);
    }

    return callback(req, Object.assign(res, { locals: result }));
  };
};
