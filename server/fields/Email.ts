export {};

const Text = require('./Text');

class Email extends Text {
  static regex = /^w+([.-]?w+)*@w+([.-]?w+)*(.w{2,3})+$/;

  constructor(flags = null) {
    super(null, null, null, flags);
    this.conform(this.regex);
  }
}

module.exports = Email;
