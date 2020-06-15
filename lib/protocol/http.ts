/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import State from "../control/State";
import Controller from "../control/Controller";
import { parseEndpoint } from "../utility";

/**
 * Creates an ```express``` middleware function to handle HTTP requests
 */
export default (callback: Function): Function => {
  return async (req: any, res: any) => {
    const { method } = parseEndpoint(req.method);

    const args = { ...req.cookies, ...req.query, ...req.body, ...req.params };
    const result = await Controller.request(method, req.path, args);

    return callback(req, Object.assign(res, { locals: result }));
  };
};
