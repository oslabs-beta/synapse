/* eslint-disable no-bitwise */
/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */

import State from '../State';
import Schema from '../Schema';
import Field from '../Field';

const applyField = (Class: any, field: Field, name: string) => {
  if (!(field instanceof Field)) {
    throw new Error('Expected instance of Field.');
  }

  if (!Class.schema) {
    Class.schema = new Schema();
  }

  Class.schema = Class.schema.extend({ [name]: field });
};

/** Represents a type that has a well-defined {@linkcode Schema}. */
export default class Validatable extends State {
  /** An instance of {@linkcode Schema} defining the properties necessary to construct an instance of the derived class. */
  static schema: Schema;
}

/** Decorator function that adds a {@linkcode Field} to the target class's {@linkcode Validatable.schema|schema} using the provided ```instance``` of {@linkcode Field} and the decorated property name.
 * @category Decorator
 * @param instance An instance of field
 * @param flags {@linkcode Field.flags|Flags} to be applied to the {@linkcode Field} ```instance```.
 */
export const field = (instance: Field, flags: number = 0): Function => {
  return (target, fieldName) => {
    const Class = target.constructor;

    if (!(Class.prototype instanceof Validatable)) {
      throw new Error("The '@field' decorator can only be used within 'Validatable' types.");
    }

    instance.flags |= flags;
    applyField(Class, instance, fieldName);
  };
};
