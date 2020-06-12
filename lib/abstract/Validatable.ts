/* eslint-disable import/extensions */

import State from "../control/State";
import Schema from "../state/Schema";
import Field from "../state/Field";

export default class Validatable extends State {
  static $field(field: Field, name: string) {
    const Class = <any>this;

    if (!(field instanceof Field)) {
      throw new Error("Expected instance of Field.");
    }

    if (!Class.schema) {
      Class.schema = new Schema();
    }

    Class.schema = Class.schema.extend({ [name]: field });
  }
}

// decorators:
export const field = (instance: Field): Function => {
  return (target, fieldName) => {
    const Class = target.constructor;
    Class.$field(instance, fieldName);
  };
};
