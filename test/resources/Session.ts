/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import { v4 as uuidv4 } from "uuid";
import { Resource, State } from "../../lib";
import { field, expose, schema } from "../../lib/@";
import { Id } from "../../lib/fields";
import User from "./User";

const sessions = {};

/** Express middleware function which sets a cookie ```client_id``` on the client if it doesn't already exist. */
export const identifier = (req, res, next) => {
  res.cookie("client_id", req.cookies.client_id || uuidv4());
  next();
};
/** Synpase middleware function which checks for a ```client_id``` property on the input arguments object whose value is associated with a valid session instance. */
export const authorizer = (args) => {
  const { client_id } = args;

  const client = sessions[client_id];

  if (!client) {
    return State.UNAUTHORIZED();
  }

  return [args];
};

export default class Session extends Resource {
  @field(new Id(36)) client_id: string;
  @field(new Id(36)) user_id: string;

  @expose("POST /")
  @schema(Session.union(User).select("username", "password", "client_id"))
  static async open({ username, password, client_id }) {
    const result = await User.authenticate({ username, password });

    if (result instanceof User) {
      sessions[client_id] = result;
    }

    return result;
  }

  @expose("GET /", authorizer)
  @schema(Session.schema.select("client_id"))
  static async read({ client_id }) {
    return sessions[client_id];
  }
}
