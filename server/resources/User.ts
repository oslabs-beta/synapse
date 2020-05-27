/* eslint-disable lines-between-class-members */

export {};

const mongoose = require('mongoose');

const { Schema } = mongoose;
const Resource = require('../synapse/Resource');
const Reply = require('../synapse/Reply');
const { OPT } = require('../synapse/Field');
const Id = require('../fields/Id');
const Email = require('../fields/Email');
const Hash = require('../fields/Hash');
const Word = require('../fields/Word');
const Text = require('../fields/Text');
const { field, endpoint, validator } = require('../synapse/decorators');
// db setup -> will move later if needed
const Any = new Schema({}, { strict: false });
const UserDB = mongoose.model('User', Any);

class User extends Resource {
  @field(new Id(24)) _id;
  @field(new Word(3, 16)) username;
  @field(new Email(OPT)) email;
  @field(new Hash(6)) password;

  @endpoint('GET /:_id')
  @validator(User.schema.select('_id'))
  static async find({ _id }) {
    // return Reply.NOT_FOUND('No user with the specified id exists.');
    UserDB.findById({ _id }, (err, user) => {
      if (err) return Reply.INTERNAL_SERVER_ERROR();
      if (!user) return Reply.NOT_FOUND();
      return User.create({ ...user });
    });
  }
  // id format from moongo:   _id: 5ecd9462dcc78b9672a88aac
  @endpoint('POST /')
  @validator(User.schema.exclude('_id'))
  static async register({ username, email, password }) {
    // const newUsers = await User.create({ id: '123', username, email, password });
    const ourUser = await UserDB.create({ username, email, password });
    return User.create(ourUser);
  }

  @validator(User.schema.select('username').extend({ password: new Text() }))
  static async authenticate({ username, password }) {
    UserDB.findOne({ username }, (err, user) => {
      if (err) return Reply.INTERNAL_SERVER_ERROR();
      if (!user) return Reply.NOT_FOUND();
      const hash = user.password;
      return Hash.validate(password, hash);
    });
    // find the user by username and get its hashed password
    // then compare to the plain-text password
  }
}

module.exports = User;
