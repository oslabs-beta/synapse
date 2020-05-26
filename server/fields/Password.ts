export {};
const Text = require('./Text');

class Password extends Text {
  constructor(min, max, flags = null) {
    super(min, max, null);
  }
}

module.exports = Password;
