/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */

import Manager from "../control/Manager";
import Controller from "../control/Controller";
import { parseEndpoint } from "../utility";

/** Creates an ```express``` middleware function to handle requests for SSE subscriptions (simply GET requests with the appropriate headers set).
 */
export default (callback: Function): Function => {
  return async (req: any, res: any, next: Function) => {
    if (req.get("Accept") !== "text/event-stream") {
      return next();
    }

    // Since a request for SSE constitutes a request for a subscription only a get request will be allowed.
    const { method } = parseEndpoint(req.method);
    if (method !== "get") {
      return res.status(400).send("Invalid Method");
    }

    // upgrade the connection
    const headers = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };
    res.set(headers).status(200);

    // create a function to handle updates to the client
    const client = (path: string, state: any) => {
      const _req = {};
      const _res = {
        locals: state,
        status: () => _res,
        json: () => res.write(`data: ${JSON.stringify({ [path]: state })}\n\n`),
      };
      callback(_req, _res);
    };

    // validate the request by attempting to GET the requested resource
    const endpoint = `${req.method} ${req.path}`;
    const args = { ...req.cookies, ...req.query, ...req.body, ...req.params };
    const state = await Controller.request("get", req.path, args);

    Manager.subscribe(client, state.$path());
    return client(endpoint, state);
  };
};
