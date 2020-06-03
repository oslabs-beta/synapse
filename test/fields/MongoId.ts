/* eslint-disable import/extensions */

import { Id } from "../../lib/fields";

export default class MongoId extends Id {
  constructor(flags = null) {
    super();

    this.assert(
      /^[0-9a-f]{24}$/i,
      true,
      "must be a single String of 12 bytes or a string of 24 hex characters"
    );
  }
}
