/* eslint-disable no-bitwise */
/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */
/* eslint-disable no-await-in-loop */

import Field from "./Field";
import { isCollectionOf } from "../utility";

/** An instance of {@linkcode Schema} defines a set of parameters by name and _fieldtype_ (see {@linkcode Field}). */
export default class Schema {
  fields: object;

  lastError: object;

  /**
   * @param fields An object whose values are all instances of {@linkcode Field} -- herein _fieldset_.
   */
  constructor(fields: object = {}) {
    // if the input is a schema, extract its fields
    if (fields instanceof Schema) {
      fields = fields.fields;
    }

    // assert that the input is a collection of fields
    isCollectionOf(Field, fields, true);

    this.fields = fields;
  }

  /** Creates a new schema containing all of the instance's fields, plus additional ```fields```.
   * @param fields A _fieldset_.
   * @returns A new instance of {@linkcode Schema}.
   */
  extend(fields: object): Schema {
    // if the input is a schema, extract its fields
    if (fields instanceof Schema) {
      fields = fields.fields;
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
    if (typeof fields === "object") {
      return this.select(...Object.keys(fields)).default(fields);
    }

    if (typeof fields === "string") {
      keys.unshift(fields);
    }

    const result = {};
    keys.forEach((key) => {
      result[key] = this.fields[key];
    });
    return new Schema(result);
  }

  /** Creates a new schema containing a subset of the instance's fields.
   * @param keys The names of the fields which should not be transferred to the new schema.
   * @return A new instance of {@linkcode Schema}.
   */
  exclude(...keys): Schema {
    const result = { ...this.fields };
    keys.forEach((key) => {
      delete result[key];
    });
    return new Schema(result);
  }

  default(values): Schema {
    const fields = {};
    Object.keys(this.fields).forEach((name) => {
      const field = this.fields[name].clone();
      if (values[name]) {
        field.default = values[name];
      }
      fields[name] = field;
    });
    return new Schema(fields);
  }

  /** _**(async)**_ Determines if the key-value pairs in ```data``` match, or can be converted to, the format of the instance's _fieldset_.
   * @param data An object to validate.
   * @returns A new object containing only the values that have been parsed by corresponding fields in the _fieldset_, or undefined if a corresponding value for any field was not present.
   */
  async validate(data: object): Promise<object> {
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
