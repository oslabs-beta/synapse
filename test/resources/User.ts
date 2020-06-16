/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import { Resource, State, Field } from "../../lib";
import { field, schema, expose } from "../../lib/@";
import { Email, Hash, Word, Text } from "../../lib/fields";
import MongoId from "../fields/MongoId";
import mongo from "../etc/database";

const { PRV } = Field.Flags;

const collection = mongo("User");

export default class User extends Resource {
  @field(new MongoId()) _id: string;
  @field(new Word(3, 16)) username: string;
  @field(new Email(true)) email: string;
  @field(new Text(), PRV) password: string;

  @expose("GET /:_id")
  @schema(User.schema.select("_id"))
  static async find({ _id }) {
    const document = await collection.findById({ _id });
    if (!document) {
      return State.NOT_FOUND();
    }
    return User.restore(document.toObject());
  }

  @expose("GET /")
  static async getAll() {
    const documents = await collection.find();
    return User.collection(documents.map((document) => document.toObject()));
  }

  @expose("POST /")
  @schema(User.schema.exclude("_id", "password").extend({ password: new Hash(6) }))
  static async register({ username, email, password }) {
    const document = await collection.create({ username, email, password });
    return User.create(document.toObject());
  }

  @expose("PATCH /:_id")
  @schema(User.schema.select("_id", "email"))
  static async update({ _id, email }) {
    const document = await collection.findOneAndUpdate({ _id }, { email }, { new: true });
    if (!document) {
      return State.NOT_FOUND();
    }
    return User.restore(document.toObject());
  }

  @expose("DELETE /:_id")
  @schema(User.schema.select("_id"))
  static async remove({ _id }) {
    const document = await collection.deleteOne({ _id });
    if (!document) {
      return State.NOT_FOUND();
    }
    return State.OK("User Deleted");
  }

  @schema(User.schema.select("username", "password"))
  static async authenticate({ username, password }) {
    const document = await collection.findOne({ username });
    if (document) {
      const user = await User.restore(document.toObject());
      if (await Hash.validate(password, user.password)) {
        return user;
      }
    }
    return State.FORBIDDEN("Incorrect username/password.");
  }
}
