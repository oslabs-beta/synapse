export {};
const Resource = require("../synapse/Resource");
const Id = require("../fields/Id");

class User extends Resource {
  static fields = {
    id: new Id(),
  };

  static endpoints = {
    "GET /:id": User.find,
  };

  static find({ id }) {}
}

module.exports = User;
