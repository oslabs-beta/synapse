/* eslint-disable prefer-const */
/* eslint-disable consistent-return */
/* eslint-disable no-ex-assign */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

export {};

const fs = require("fs");
const Resource = require("./Resource");
const Reply = require("./Reply");
const Manager = require("./Manager");
const Controller = require("./Controller");
const Schema = require("./Schema");
const Field = require("./Field");
const { isCollectionOf, tryParseJSON } = require("./etc/util");

/**
 * Initializes API request handlers from Resource definitions in the given directory 'dir'.
 * @param dir A directory containing Resource definitions.
 * @returns An object containing properties 'ws' and 'http', whose values are request handlers for the respective protocol.
 */
function synapse(dir) {
  const controller = new Controller();

  // get all file names in 'dir'
  const files = fs.readdirSync(dir);
  const classes = []; // each file will be required and stored in an array
  files.forEach((file) => {
    const Class = require(`${dir}/${file}`);
    const isResource = Class.prototype instanceof Resource;
    const hasEndpoints = typeof Class.endpoints === "object";

    classes.push(Class);

    // if file contains a Resource class, add each of its endpoints to the router
    if (isResource && hasEndpoints) {
      Object.keys(Class.endpoints).forEach((key: string) => {
        let [method, path] = key.split(" "); // ex. 'GET /:id => [ 'GET, '/:id' ]
        method = method.toLowerCase(); // ex. 'GET' => 'get'
        path = `/${Class.name.toLowerCase()}${path}`; // ex. '/:id' => '/user/:id'

        // add route to router: ex. router.get('/user/:id', ...
        controller.declare(method, path, async (args: object) => {
          let result;

          try {
            result = await Class.endpoints[key](args); // invoke the endpoint method

            // if the result is a Resource or array of Resources, convert it to a reply
            if (
              result instanceof Resource ||
              isCollectionOf(Resource, result)
            ) {
              result = new Reply(method === "post" ? 201 : 200, result);
            }

            // the result should now be an instance of Reply
            if (!(result instanceof Reply)) {
              throw new Error(
                `Unexpected result from endpoint '${method} ${path}'.`
              );
            }
          } catch (err) {
            result = Reply.INTERNAL_SERVER_ERROR();
          }

          return result;
        });
      });
    }
  });

  const manager = new Manager(controller);

  // attach the manager to each class
  for (let i = 0; i < classes.length; ++i) {
    classes[i].manager = manager;
  }

  return {
    // express middleware function to handle HTTP requests
    http: async (req: any, res: any, next: Function) => {
      const method = req.method.toLowerCase();

      // attempt to execute the request by calling the appropriate method on the manager object
      const result = await manager[method](req.path, {
        ...req.query,
        ...req.body,
        ...req.params,
      });

      // send the result to the client
      res.status(result.status).json(result.payload);
    },

    // express-ws middleware function to handle new WebSocket connections
    ws: (ws: any, req: any) => {
      // when a new connection is received, create a function to handle updates to that client
      const client = (path: string, state: any) => {
        ws.send(JSON.stringify({ [path]: state }));
      };

      // whenever a message is received from the client
      ws.on("message", async (msg: string) => {
        // attempt to parse the message as json
        const data = tryParseJSON(msg);

        // the result should be an object whose keys represent endpoints
        // in the form of 'METHOD /path' and whose values are objects containing
        // the arguments to be passed to the associated endpoint.
        if (typeof data !== "object") {
          return client("/", Reply.BAD_REQUEST());
        }

        // attempt to execute each request by calling the appropriate method on the manager object
        Object.keys(data).forEach(async (endpoint: string) => {
          let [method, path] = endpoint.split(" ");

          method = method.toLowerCase();
          if (method === "unsubscribe") {
            manager.unsubscribe(client, path);
            return client(endpoint, Reply.OK());
          }
          if (method === "subscribe") {
            manager.subscribe(client, path);
            method = "get";
          }

          const result = await manager[method](
            path,
            data[endpoint],
            client // pass the client updater function to subscribe the client to the requested resource
          );

          // send the result to the client
          client(endpoint, result);
        });
      });
    },
  };
}

synapse.Field = Field;
synapse.Schema = Schema;
synapse.Resource = Resource;
synapse.Reply = Reply;
synapse.Controller = Controller;
synapse.Manager = Manager;

module.exports = synapse;
