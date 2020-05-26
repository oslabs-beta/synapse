export {};
<<<<<<< HEAD
const Resource = require('../synapse/Resource');
const Id = require('../fields/Id');

class User extends Resource {
  static fields = {
    id: new Id(),
  };

  static endpoints = {
    'GET /:id': User.find,
  };

  static find({ id }) {}
=======
const Resource = require("../synapse/Resource");
const Schema = require("../synapse/Schema");
const Id = require("../fields/Id");
const Email = require("../fields/Email");

const { field, endpoint, validator } = require("../synapse/decorators");
const Reply = require("../synapse/Reply");

class User extends Resource {
  @field(new Id(3)) id;

  @field(new Email()) email;

  @endpoint("GET /:id")
  @validator(User.schema.select("id"))
  static find({ id }) {
    return User.create({ id });
  }
>>>>>>> 38e5ac8b8b958d6fa382e58978daa755a69d505a
}

module.exports = User;
