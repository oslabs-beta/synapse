/* eslint-disable no-bitwise */
/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */
/* eslint-disable no-await-in-loop */

import Field from './Field';
import { isCollectionOf } from './utility';

/** An instance of {@linkcode Schema} defines a set of parameters by name and _fieldtype_ (see {@linkcode Field}). */
export default class Schema {
  /** An object whose values are all instances of {@linkcode Field} (herein _fieldset_). */
  fields: object;

  /** The error message produced by the last call to {@linkcode Schema.validate|Schema.prototype.validate}, if it was unsuccessful. */
  lastError: object;

  /**
   * @param fields See {@linkcode Schema.fields|Schema.prototype.fields}.
   */
  constructor(fields: object = {}) {
    // assert that the input is a collection of fields
    isCollectionOf(Field, fields, true);

    this.fields = fields;
  }

  /** Returns a copy of the {@linkcode Schema} instance. */
  clone(): Schema {
    const fields = {};
    Object.keys(this.fields).forEach((name) => {
      fields[name] = this.fields[name].clone();
    });
    return new Schema(fields);
  }

  /** Creates a new schema containing all of the instance's fields, plus additional ```fields```.
   * @param fields A _fieldset_.
   * @returns A new instance of {@linkcode Schema}.
   */
  extend(fields: object | Schema): Schema {
    // if the input is a schema, extract its fields
    if (fields instanceof Schema) {
      fields = fields.clone().fields;
    }

    // assert that the input is a collection of fields
    isCollectionOf(Field, fields, true);

    return new Schema({ ...this.fields, ...fields });
  }

  /** Creates a new schema containing a subset of the instance's fields.
   * @param keys The names of the fields which should be transferred to the new schema.
   * @return A new instance of {@linkcode Schema}.
   */
  select(fields: object | string = null, ...keys: Array<string>): Schema {
    if (typeof fields === 'string') {
      keys.unshift(fields);
    }

    const result = {};
    keys.forEach((key) => {
      if (this.fields[key]) {
        result[key] = this.fields[key].clone();
      }
    });
    return new Schema(result);
  }

  /** Creates a new schema containing a subset of the instance's fields.
   * @param keys The names of the fields which should not be transferred to the new schema.
   * @return A new instance of {@linkcode Schema}.
   */
  exclude(...keys: Array<string>): Schema {
    const result = this.clone();
    keys.forEach((key) => {
      delete result.fields[key];
    });
    return result;
  }

  /** Given an object ```values``` whose keys correspond to fields on the instance's _fieldset_ and whose values represent default values of those fields, applies those default values to the corresponding fields on a clone of the instance.
   * @param values An object with keys corresponding to field names and values representing default field values.
   * @return A new instance of {@linkcode Schema}.
   */
  default(values: object): Schema {
    const result = this.clone();
    Object.keys(result.fields).forEach((name) => {
      result.fields[name].default = values[name];
    });
    return result;
  }

  /** Given an object ```values``` whose keys correspond to fields on the instance's _fieldset_ and whose values represent {@linkcode Field.flags|flag} values, applies those flag values to the corresponding fields on a clone of the instance.
   * @param values An object with keys corresponding to field names and values representing flag values.
   * @return A new instance of {@linkcode Schema}.
   */
  flags(values: object): Schema {
    const result = this.clone();
    Object.keys(result.fields).forEach((name) => {
      result.fields[name].flags = values[name] || 0;
    });
    return result;
  }

  /** _**(async)**_ Determines if the key-value pairs in ```data``` match, or can be converted to, the format of the instance's _fieldset_.
   * @param data An object to validate.
   * @returns A new object containing only the values that have been parsed by corresponding fields in the _fieldset_, or undefined if a corresponding value for any field was not present.
   */
  async validate(data: object): Promise<object> {
    if (!data || typeof data !== 'object') {
      return undefined;
    }
    // for each field in the schema, parse the corresponding input value from 'data'
    const keys = Object.keys(this.fields);
    const parsed = await Promise.all(keys.map((key) => this.fields[key].parse(data[key])));

    // initialize the output object and reset the lastError property
    let output = {};
    this.lastError = null;
    parsed.forEach((value, i) => {
      const key = keys[i];
      if (value === undefined) {
        // if any result is undefined, the input data is invalid
        if (!this.lastError) {
          // set the lastError property to a new object and the output to undefined
          this.lastError = {};
          output = undefined;
        }
        // transfer the error message from the field to the lastError object
        this.lastError[key] = this.fields[key].lastError;
      } else if (output) {
        // if no errors have occured yet, transfer the successfully parse value to the output object
        output[key] = value;
      }
    });

    return output;
  }
}
