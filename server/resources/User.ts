/* eslint-disable lines-between-class-members */

export {};
<<<<<<< HEAD
const Resource = require('../synapse/Resource');
const Schema = require('../synapse/Schema');
const Id = require('../fields/Id');
const Email = require('../fields/Email');

const { field, endpoint, validator } = require('../synapse/decorators');
const Reply = require('../synapse/Reply');
=======

const Resource = require("../synapse/Resource");
const { OPT } = require("../synapse/Field");
const Id = require("../fields/Id");
const Email = require("../fields/Email");
const { field, endpoint, validator } = require("../synapse/decorators");
>>>>>>> 3c80fda9be6370fb4b7acf497a5cd76464e8b5f8

class User extends Resource {
  @field(new Id(3)) id;
  @field(new Email(OPT)) email;

  @endpoint('GET /:id')
  @validator(User.schema.select('id'))
  static find({ id }) {
    return User.create({ id });
  }
}

module.exports = User;
