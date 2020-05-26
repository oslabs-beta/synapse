export {};
<<<<<<< HEAD
const Text = require('./Text');
=======

const Text = require("./Text");
>>>>>>> 0ff72496acf4a7b48a69e0b48c48c15ee486f85c

class Id extends Text {
  constructor(length, flags = null) {
    super(length, length, null, flags);

    this.assert(
      /[^\w-]/,
      false,
      "must contain only alphanumeric characters, underscores and dashes"
    );
  }
}

module.exports = Id;
