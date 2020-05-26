/* eslint-disable lines-between-class-members */

export {};

const Resource = require('../synapse/Resource');
const Reply = require('../synapse/Reply');
const { OPT } = require('../synapse/Field');
const Id = require('../fields/Id');
const Email = require('../fields/Email');
const Hash = require('../fields/Hash');
const Word = require('../fields/Word');
const Text = require('../fields/Text');
const { field, endpoint, validator } = require('../synapse/decorators');

class User extends Resource {
  @field(new Id(3)) id;
  @field(new Word(3, 16)) username;
  @field(new Email(OPT)) email;
  @field(new Hash(6)) password;

  @endpoint('GET /:id')
  @validator(User.schema.select('id'))
  static async find({ id }) {
    return Reply.NOT_FOUND('No user with the specified id exists.');
  }

  @endpoint('POST /')
  @validator(User.schema.exclude('id'))
  static async register({ username, email, password }) {
    return User.create({ id: '123', username, email, password });
  }

  @validator(User.schema.select('username').extend({ password: new Text() }))
  static async authenticate({ username, password }) {
    // find the user by username and get its hashed password
    // then compare to the plain-text password
    return Hash.validate(password, '[users pass hash]');
  }
}

module.exports = User;
