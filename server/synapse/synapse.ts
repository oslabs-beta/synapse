/* eslint-disable no-ex-assign */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

export {};

const fs = require("fs");
const Resource = require("./Resource");
const Reply = require("./Reply");
const Manager = require("./Manager");
const Controller = require("./Controller");

/**
 * Verifies that all elements of the input are of type Resource, so that they can access its methods.
 * Invoked after the router method is called to check its result
 * @param arr The array that is returned after calling a router method
 * @returns A boolean that is used for a conditional check
 */
const isResourceArray = (arr: Array<typeof Resource>) => {
  if (!Array.isArray(arr)) {
    return false;
  }
  for (let i = 0; i < arr.length; ++i) {
    if (!(arr[i] instanceof Resource)) {
      return false;
    }
  }
  return true;
};

/**
 * Initializes API request handlers from Resource definitions in the given directory 'dir'.
 * @param dir A directory containing Resource definitions.
 * @returns An object containing properties 'ws' and 'http', whose values are request handlers for the respective protocol.
 */
const synapse = (dir) => {
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
      Object.keys(Class.endpoints).forEach((key) => {
        let [method, path] = key.split(" "); // ex. 'GET /:id => [ 'GET, '/:id' ]
        method = method.toLowerCase(); // ex. 'GET' => 'get'
        path = `/${Class.name.toLowerCase()}${path}`; // ex. '/:id' => '/user/:id'

        // add route to router: ex. router.get('/user/:id', ...
        controller.declare(method, path, async (args) => {
          let result = await Class.endpoints[key](args); // invoke the endpoint method

          // if the result is a Resource or array of Resources, convert it to a reply
          if (result instanceof Resource || isResourceArray(result)) {
            result = new Reply(method === "post" ? 201 : 200, result);
          }

          // the result should now be an instance of Reply
          if (!(result instanceof Reply)) {
            throw new Error(
              `Unexpected result from endpoint '${method} ${path}'.`
            );
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
    http: async (req, res, next) => {
      try {
        const result = await manager[req.method.toLowerCase()](req.path, {
          ...req.query,
          ...req.body,
          ...req.params,
        });

        res.status(result.status).json(result.payload);
      } catch (err) {
        if (!(err instanceof Reply)) {
          console.log(err);
          err = Reply.INTERNAL_SERVER_ERROR();
        }
        return next(err);
      }
    },
    ws: (ws, req) => {
      ws.on("message", async (msg) => {
        try {
          const data = JSON.parse(msg);

          Object.keys(data).forEach(async (endpoint) => {
            const [method, path] = endpoint.split(" ");

            const result = await manager[method.toLowerCase()](
              path,
              data[endpoint],
              (state) => ws.send(JSON.stringify({ [path]: state }))
            );

            ws.send(JSON.stringify({ [endpoint]: result }));
          });
        } catch (err) {
          if (!(err instanceof Reply)) {
            console.log(err);
            err = Reply.INTERNAL_SERVER_ERROR();
          }
          ws.send(JSON.stringify(err));
        }
      });
    },
  };
};

module.exports = synapse;
