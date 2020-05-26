/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
export {};

const fs = require('fs');
const { Router } = require('express');
const Resource = require('./Resource');
const Reply = require('./Reply');

const isResourceArray = (arr) => {
  for (let i = 0; i < arr.length; ++i) {
    if (!(arr[i] instanceof Resource)) {
      return false;
    }
  }
  return true;
};

const synapse = (dir) => {
  const router = Router();

  const files = fs.readdirSync(dir); // get all files from 'dir' as array

  // require each file in array
  files.forEach((file) => {
    const Class = require(`${dir}/${file}`);
    const isResource = Class.prototype instanceof Resource;
    const hasEndpoints = typeof Class.endpoints === 'object';

    // if file contains a Resource class, add each of its endpoints to the router
    if (isResource && hasEndpoints) {
      Object.keys(Class.endpoints).forEach((key) => {
        let [method, path] = key.split(' '); // ex. 'GET /:id => [ 'GET, '/:id' ]
        method = method.toLowerCase(); // ex. 'GET' => 'get'
        path = `/${Class.name.toLowerCase()}${path}`; // ex. '/:id' => '/user/:id'

        // add route to router: ex. router.get('/user/:id', ...
        router[method](path, async (req, res) => {
          try {
            const result = await Class.endpoints[key](req, res); // invoke the endpoint method

            // the result should be either a Reply, Resource or array of Resources
            if (result instanceof Reply) {
              res.status(result.status).send(result.payload);
            } else if (result instanceof Resource || isResourceArray(result)) {
              res.status(200).json(result);
            } else {
              throw new Error(`Unexpected result from endpoint ${Class.name}::${key}.`);
            }
          } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
          }
        });
      });
    }
  });
  return router;
};

module.exports = synapse;
