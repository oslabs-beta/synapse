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
            let result = await Class.endpoints[key](req, res); // invoke the endpoint method

            // if the result is a Resource or array of Resources, convert it to a reply
            if (result instanceof Resource || isResourceArray(result)) {
              result = new Reply(method === "post" ? 201 : 200, result);
            }

            // the result should now be an instance of Reply
            if (result instanceof Reply) {
              if (result.isError()) {
                return next(result);
              }
              return res.send(result);
            }

            throw new Error(
              `Unexpected result from endpoint '${method} ${path}'.`
            );
          } catch (err) {
            console.log(err);
          }

          // any unhandled errors produce generic 500
          return next(Reply.INTERNAL_SERVER_ERROR());
        });
      });
    }
  });

  const manager = new Manager(async (method, path, args) => {
    return new Promise((resolve, reject) => {
      router(
        { method: method.toUpperCase(), url: path, body: args },
        { send: (success) => resolve(success) },
        (error) => reject(error)
      );
    });
  });

  return {
    http: async (req, res, next) => {
      const data = {
        ...req.query,
        ...req.body,
        ...req.params,
      };
      manager[req.method.toLowerCase()](req.path, data)
        .then((result) => res.status(result.status).json(result.payload))
        .catch((err) => next(err));
    },
    ws: (ws, req) => {
      ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        Object.keys(data).forEach(async (endpoint) => {
          const [method, path] = endpoint.split(" ");

          manager[method.toLowerCase()](path, data[endpoint])
            .then((result) => ws.send(JSON.stringify(result.payload)))
            .catch((err) => ws.send(err.serialize()));
        });
      });
    },
  };
};

module.exports = synapse;
