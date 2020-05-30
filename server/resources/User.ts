/* eslint-disable lines-between-class-members */

export {};

const { Resource, Reply, Field } = require("../synapse");
const { Email, Hash, Word, Text } = require("../synapse/fields");
const MongoId = require("../fields/MongoId");
const UserDB = require("../database")("User");

const { field, endpoint, validator } = Resource.decorators;
const { OPT } = Field.Flags;

class User extends Resource {
  @field(new MongoId()) _id;
  @field(new Word(3, 16)) username;
  @field(new Email(OPT)) email;
  @field(new Text()) password;

  @endpoint("GET /:_id")
  @validator(User.schema.select("_id"))
  static async find({ _id }) {
    const ourUser = await UserDB.findById({ _id });
    if (!ourUser) {
      return Reply.NOT_FOUND();
    }
<<<<<<< HEAD
    return User.create(ourUser.toObject());
=======
    return User.instantiate(ourUser.toObject());
>>>>>>> b7c29f64f8b87d08441149bb7827e7dfe578cc28
  }

  @endpoint("GET /")
  static async getAll() {
    const users = await UserDB.find();
    const result = await Promise.all(
<<<<<<< HEAD
      users.map((user) => User.create(user.toObject()))
=======
      users.map((user) => User.instantiate(user.toObject()))
>>>>>>> b7c29f64f8b87d08441149bb7827e7dfe578cc28
    ).then((res) => {
      return res;
    });
    return result;
  }

  @endpoint("POST /")
  @validator(User.schema.exclude("_id", "password").extend({ password: new Hash(6) }))
  static async register({ username, email, password }) {
    const ourUser = await UserDB.create({ username, email, password });
    return User.instantiate(ourUser.toObject());
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
