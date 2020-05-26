/* eslint-disable lines-between-class-members */

export {};

const Resource = require("../synapse/Resource");
const { OPT } = require("../synapse/Field");
const Id = require("../fields/Id");
const Email = require("../fields/Email");
const { field, endpoint, validator } = require("../synapse/decorators");

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
