export {};

const Id = require("./Id");

class MongoId extends Id {
  constructor(length, flags = null) {
    super(length);

    this.assert(
      /^[0-9a-f]{24}$/i,
      true,
      "Argument passed in must be a single String of 12 bytes or a string of 24 hex characters"
    );
  }
}

module.exports = MongoId;
