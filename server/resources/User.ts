/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import { Resource, Reply } from "../synapse";
import { field, endpoint, validator } from "../synapse/Resource";
import { Email, Hash, Word, Text } from "../synapse/fields";
import MongoId from "../fields/MongoId";
import mongo from "../database";

const collection = mongo("User");

export default class User extends Resource {
  @field(new MongoId()) _id: string;
  @field(new Word(3, 16)) username: string;
  @field(new Email(true)) email: string;
  @field(new Text()) password: string;

  @endpoint("GET /:_id")
  @validator(User.schema.select("_id"))
  static async find({ _id }) {
    const document = await collection.findById({ _id });
    if (!document) {
      return Reply.NOT_FOUND();
    }
    return User.instantiate(document.toObject());
  }

  @endpoint("GET /")
  static async getAll() {
    const documents = await collection.find();
    return Promise.all(
      documents.map((document) => User.instantiate(document.toObject()))
    );
  }

  @endpoint("POST /")
  @validator(
    User.schema.exclude("_id", "password").extend({ password: new Hash(6) })
  )
  static async register({ username, email, password }) {
    const document = await collection.create({ username, email, password });
    return User.instantiate(document.toObject());
  }

  @endpoint("POST /me")
  @validator(User.schema.select("username", "password"))
  static async authenticate({ username, password }) {
    const document = await collection.findOne({ username });
    if (document) {
      const user = await User.instantiate(document.toObject());
      if (await Hash.validate(password, user.password)) {
        return user;
      }
    }
    return Reply.FORBIDDEN("Incorrect username/password.");
  }
}
