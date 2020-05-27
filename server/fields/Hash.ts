export {};

const bcrypt = require("bcrypt");
const Text = require("./Text");

class Hash extends Text {
  saltRounds: number;

  constructor(
    min: number = null,
    max: number = null,
    flags: number = null,
    saltRounds: number = 10
  ) {
    super(min, max, null, flags);

    this.saltRounds = saltRounds;
  }

  async parse(value: any) {
    if (await super.parse(value)) {
      return bcrypt.hash(value, this.saltRounds);
    }
    return undefined;
  }

  static async validate(value, hash) {
    return bcrypt.compare(value, hash);
  }
}

module.exports = Hash;
