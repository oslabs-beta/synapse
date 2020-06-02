/* eslint-disable camelcase */
/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import { Resource, Reply } from "../synapse";
import { field, endpoint, validator } from "../synapse/Resource";
import Id from "../synapse/fields/Id";
import User from "./User";

const sessions = {};

function authorizer(args) {
  const { client_id } = args;

  const client = sessions[client_id];

  if (!client) {
    return Reply.UNAUTHORIZED();
  }

  return [args];
}

export default class Session extends Resource {
  @field(new Id(36)) client_id: string;
  @field(new Id(36)) user_id: string;

  @endpoint("POST /")
  @validator(Session.union(User).select("username", "password", "client_id"))
  static async create({ username, password, client_id }) {
    const result = await User.authenticate({ username, password });

    if (result instanceof User) {
      sessions[client_id] = result;
    }

    return result;
  }

  @endpoint("GET /", authorizer)
  @validator(Session.schema.select("client_id"))
  static async read({ client_id }) {
    return sessions[client_id];
  }
}
