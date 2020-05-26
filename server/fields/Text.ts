export {};
const { Field } = require('../synapse/Field');

class Text extends Field {
  constructor(
    min: number = null,
    max: number = null,
    defaultVal: any = null,
    flags: number = null
  ) {
    super(defaultVal, flags);

    if (min !== null) {
      this.conform(`.{${min}}`);
    }
    if (max !== null) {
      this.conform(`.{${max + 1}}`, true);
    }
  }
}

module.exports = Text;
