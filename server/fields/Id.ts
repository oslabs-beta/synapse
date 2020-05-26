export {};
<<<<<<< HEAD
const Field = require('../synapse/Field');
=======
const Text = require("./Text");
>>>>>>> 38e5ac8b8b958d6fa382e58978daa755a69d505a

class Id extends Text {
  constructor(length, flags = null) {
    super(length, length, null, flags);
    this.conform(/[^\w-]/, true);
  }
}

module.exports = Id;
