export { };

const { Router } = require('express');

const synapse = (dir) => {
  const router = Router();

  // static endpoints = {
  //   'GET /:id': User.find
  // };
  // =>
  // router.get('/user/:id', User.find);

  return router;
};

module.exports = synapse;