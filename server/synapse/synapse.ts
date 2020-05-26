/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
export {};

const fs = require("fs");
const { Router } = require("express");
const Resource = require("./Resource");
const Reply = require("./Reply");

/*
  verifies that all elements in 'arr'
  are of the type Resource.
*/
const isResourceArray = (arr) => {
  for (let i = 0; i < arr.length; ++i) {
    if (!(arr[i] instanceof Resource)) {
      return false;
    }
  }
  return true;
};

/*
  Returns an express router exposing all available Resource 
  endpoints defined in the specified directory 'dir'.
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
              if (result.isError()) {
                return next(result); // if the reply has an error status return the error to express.
              }

              return res.status(result.status).send(result.serialize());
            }

            if (result instanceof Resource || isResourceArray(result)) {
              const status = method === "post" ? 201 : 200;
              return res.status(status).json(result);
            }

            throw new Error(
              `Unexpected result from endpoint '${method} ${path}'.`
            );
          } catch (err) {
            console.log("error", err);
          }

          // send any unhandled errors back to express
          return next(Reply.INTERNAL_SERVER_ERROR());
        });
      });
    }
  });
  return router;
};

module.exports = synapse;
