/* eslint-disable lines-between-class-members */

export {};

const { Resource, Reply, Field } = require("../synapse");
const { Email, Hash, Word, Text } = require("../synapse/fields");
const MongoId = require("../fields/MongoId");
const UserDB = require("../database")("User");

const { field, endpoint, validator } = Resource.Decorators;
const { OPT } = Field.Flags;

class User extends Resource {
  @field(new MongoId()) _id;
  @field(new Word(3, 16)) username;
  @field(new Email(OPT)) email;
  @field(new Text()) password;

  @endpoint("GET /")
  static async all() {
    return Reply.OK("updated");
  }

  @endpoint("GET /:_id")
  @validator(User.schema.select("_id"))
  static async find({ _id }) {
    const ourUser = await UserDB.findById({ _id });
    if (!ourUser) {
      return Reply.NOT_FOUND();
    }
    const newUser = await User.create(ourUser.toObject());
    console.log(newUser);
    return User.create(ourUser.toObject());
  }
  @endpoint("GET /")
  static async getAll() {
    const users = await UserDB.find();
    const result = await Promise.all(
      users.map((user) => User.create(user.toObject()))
    ).then((res) => {
      return res;
    });
    return result;
  }

  @endpoint("POST /")
  @validator(
    User.schema.exclude("_id", "password").extend({ password: new Hash(6) })
  )
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
