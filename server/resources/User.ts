export {};
const Resource = require('../synapse/Resource');
const Schema = require('../synapse/Schema');
const Id = require('../fields/Id');
const Email = require('../fields/Email');

const { field, endpoint, validator } = require('../synapse/decorators');
const Reply = require('../synapse/Reply');

class User extends Resource {
  @field(new Id(3)) id;

  @field(new Email()) email;

  @endpoint('GET /:id')
  @validator(User.schema.select('id'))
  static find({ id }) {
    return User.create({ id });
  }
}

module.exports = User;
