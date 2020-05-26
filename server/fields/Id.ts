export {};
const Text = require('./Text');

class Id extends Text {
  constructor(length, flags = null) {
    super(length, length, null, flags);
    this.conform(/[^\w-]/, true);
  }
}

module.exports = Id;
