/* eslint-disable lines-between-class-members */

import { userInfo } from "os";

export {};

<<<<<<< HEAD
const Resource = require('../synapse/Resource');
const Reply = require('../synapse/Reply');
const { OPT } = require('../synapse/Field');
const Id = require('../fields/Id');
const Email = require('../fields/Email');
const Hash = require('../fields/Hash');
const Word = require('../fields/Word');
const Text = require('../fields/Text');
const { field, endpoint, validator } = require('../synapse/decorators');
=======
const mongoose = require("mongoose");

const { Schema } = mongoose;
const Resource = require("../synapse/Resource");
const Reply = require("../synapse/Reply");
const { OPT } = require("../synapse/Field");
const Id = require("../fields/Id");
const Email = require("../fields/Email");
const Hash = require("../fields/Hash");
const Word = require("../fields/Word");
const Text = require("../fields/Text");
const { field, endpoint, validator } = require("../synapse/decorators");
// db setup -> will move later if needed
const Any = new Schema({}, { strict: false });
const UserDB = mongoose.model("User", Any);
>>>>>>> b826f753624daf4a092b077e7ad97ba5faff2041

class User extends Resource {
  @field(new Id(24)) _id;
  @field(new Word(3, 16)) username;
  @field(new Email(OPT)) email;
  @field(new Hash(6)) password;

<<<<<<< HEAD
  @endpoint('GET /:id')
  @validator(User.schema.select('id'))
  static async find({ id }) {
    return Reply.NOT_FOUND('No user with the specified id exists.');
  }

  @endpoint('POST /')
  @validator(User.schema.exclude('id'))
  static async register({ username, email, password }) {
    return User.create({ id: '123', username, email, password });
=======
  @endpoint("GET /:_id")
  @validator(User.schema.select("_id"))
  static async find({ _id }) {
    // return Reply.NOT_FOUND('No user with the specified id exists.');
    const ourUser = await UserDB.findById({ _id });
    if (!ourUser) {
      return Reply.NOT_FOUND();
    }
    return User.create(ourUser.toObject());
  }
  // id format from moongo:   _id: 5ecd9462dcc78b9672a88aac
  @endpoint("POST /")
  @validator(User.schema.exclude("_id"))
  static async register({ username, email, password }) {
    // const newUsers = await User.create({ id: '123', username, email, password });
    const ourUser = await UserDB.create({ username, email, password });
    return User.create(ourUser.toObject());
>>>>>>> b826f753624daf4a092b077e7ad97ba5faff2041
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
<<<<<<< HEAD
    return Hash.validate(password, '[users pass hash]');
=======
>>>>>>> b826f753624daf4a092b077e7ad97ba5faff2041
  }
}

module.exports = User;
