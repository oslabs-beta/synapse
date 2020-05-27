export {};

const Text = require('./Text');

class Id extends Text {
  constructor(length, flags = null) {
    super(length, length, null, flags);

    this.assert(
      /[^\w-]/,
      false,
      'must contain only alphanumeric characters, underscores and dashes'
    );
  }
}

module.exports = Id;
