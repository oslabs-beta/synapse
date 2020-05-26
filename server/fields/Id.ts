export {};
const Field = require('../synapse/Field');

class Id extends Field {
  parse(value) {
    return value;
  }
}

module.exports = Id;
