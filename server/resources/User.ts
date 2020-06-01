/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import { Resource, Reply } from "../synapse";
import { field, endpoint, validator } from "../synapse/Resource";
import { Email, Hash, Word, Text } from "../synapse/fields";
import MongoId from "../fields/MongoId";
import mongo from "../database";

const UserDB = mongo("User");

export default class User extends Resource {
  @field(new MongoId()) _id;
  @field(new Word(3, 16)) username;
  @field(new Email(true)) email;
  @field(new Text()) password;

  @endpoint("GET /:_id")
  @validator(User.schema.select("_id"))
  static async find({ _id }) {
    const ourUser = await UserDB.findById({ _id });
    if (!ourUser) {
      return Reply.NOT_FOUND();
    }
    return User.instantiate(ourUser.toObject());
  }

  @endpoint("GET /")
  static async getAll() {
    const users = await UserDB.find();
    const result = await Promise.all(
      users.map((user) => User.instantiate(user.toObject()))
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
