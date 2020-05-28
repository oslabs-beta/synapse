/* eslint-disable lines-between-class-members */

export {};

const UserDB = require("../database")("User");
const Resource = require("../synapse/Resource");
const MongoId = require("../fields/MongoId");
const Reply = require("../synapse/Reply");
const { OPT } = require("../synapse/Field");
const Id = require("../fields/Id");
const Email = require("../fields/Email");
const Hash = require("../fields/Hash");
const Word = require("../fields/Word");
const Text = require("../fields/Text");
const { field, endpoint, validator } = require("../synapse/decorators");

class User extends Resource {
  @field(new MongoId()) _id;
  @field(new Word(3, 16)) username;
  @field(new Email(OPT)) email;
  @field(new Hash(6)) password;

  @endpoint("GET /:_id")
  @validator(User.schema.select("_id"))
  static async find({ _id }) {
    const ourUser = await UserDB.findById({ _id });
    if (!ourUser) {
      return Reply.NOT_FOUND();
    }
    return User.create(ourUser.toObject());
  }

  @endpoint("POST /")
  @validator(User.schema.exclude("_id"))
  static async register({ username, email, password }) {
    const ourUser = await UserDB.create({ username, email, password });
    return User.create(ourUser.toObject());
  }

  @validator(User.schema.select("username").extend({ password: new Text() }))
  static async authenticate({ username, password }) {
    UserDB.findOne({ username }, (err, user) => {
      if (err) return Reply.INTERNAL_SERVER_ERROR();
      if (!user) return Reply.NOT_FOUND();
      const hash = user.password;
      return Hash.validate(password, hash);
    });
  }
}

module.exports = User;
