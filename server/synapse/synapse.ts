/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
export {};

const fs = require("fs");
const { Router } = require("express");
const Resource = require("./Resource");
const Reply = require("./Reply");
const Manager = require("./Manager");

/**
 * Verifies that all elements of the input are of type Resource, so that they can access its methods.
 * Invoked after the router method is called to check its result
 * @param arr The array that is returned after calling a router method
 * @returns A boolean that is used for a conditional check
 */
const isResourceArray = (arr) => {
  for (let i = 0; i < arr.length; ++i) {
    if (!(arr[i] instanceof Resource)) {
      return false;
    }
  }
  return true;
};

/**
 * Dynamically creates an express router for any method and
 * exposes all available Resource endpoints that are defined in the specified directory.
 * @param dir The specified directory used to create the express router(s) according to their endpoints.
 * @returns An express router
 */
const synapse = (dir) => {
  const router = Router();
  const files = fs.readdirSync(dir); // get all files from 'dir' as array
  // require each file in array
  files.forEach((file) => {
    const Class = require(`${dir}/${file}`);
    const isResource = Class.prototype instanceof Resource;
    const hasEndpoints = typeof Class.endpoints === "object";

    // if file contains a Resource class, add each of its endpoints to the router
    if (isResource && hasEndpoints) {
      Object.keys(Class.endpoints).forEach((key) => {
        let [method, path] = key.split(" "); // ex. 'GET /:id => [ 'GET, '/:id' ]
        method = method.toLowerCase(); // ex. 'GET' => 'get'
        path = `/${Class.name.toLowerCase()}${path}`; // ex. '/:id' => '/user/:id'

        // add route to router: ex. router.get('/user/:id', ...
        router[method](path, async (req, res, next) => {
          try {
            // create a copy of 'res' with certain methods disabled
            const limitedRes = {
              ...res,
              send: undefined,
              json: undefined,
              status: undefined,
            };
            const result = await Class.endpoints[key](req, limitedRes); // invoke the endpoint method

            // the result should be either a Reply, Resource or array of Resources
            if (result instanceof Reply) {
              // fix
              // if (result.isError()) {
              //   next(result); // if the reply has an error status return the error to express.
              // }

              return res.status(result.status).send(result.serialize());
            }
            if (result instanceof Resource || isResourceArray(result)) {
              const status = method === "post" ? 201 : 200;
              return res.status(status).send(JSON.stringify(result)); // FIX: json method undefined
            }

            throw new Error(`Unexpected result from endpoint '${method} ${path}'.`);
          } catch (err) {
            console.log(err);
          }

          // fix: send any unhandled errors back to express
          // next(Reply.INTERNAL_SERVER_ERROR());
        });
      });
    }
  });

  const manager = new Manager(router);

  return {
    http: async (req, res) => {
      const result = await manager[req.method.toLowerCase()](req.path, {
        ...req.query,
        ...req.body,
        ...req.params,
      });
      res.status(result.status).send(result.body);
    },
    ws: (ws, req) => {
      ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        console.log(data);
        Object.keys(data).forEach(async (endpoint) => {
          const [method, path] = endpoint.split(" ");

          const result = await manager[method.toLowerCase()](path, data[endpoint]);
          ws.send(result.body);
        });
      });
    },
  };
};

module.exports = synapse;
