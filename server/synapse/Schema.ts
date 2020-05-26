/* eslint-disable no-await-in-loop */
export {};

const { Field } = require('./Field');

/**
 * Checks that all values of the input are of type Field.
 * @param obj An object containing the fields(rules) of its class
 * @returns True if all values are of correct type, and an error if not.
 */
const assertIsFieldObject = (obj: object) => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; ++i) {
    if (!(obj[keys[i]] instanceof Field)) {
      throw new Error('Expected object containing only values of type Field.');
    }
  }
  return true;
};

/**
 * Defines a type of object as a set of key names
 * and value types (Fields). Can validate that a
 * given object meets its requirements.
 * @param fields An empty object by default. Look into the decorator "fields" (link: ***somelink***) for more details on adding fields to Schema.
 */
class Schema {
  fields: object;

  lastError: string;

  constructor(fields: object = {}) {
    assertIsFieldObject(fields);

    this.fields = fields;
  }

  /**
   * Extends current fields.
   * @param fields An object that contains key names and value types to extend current fields.
   * @returns A new Schema containing all the fields of this schema, plus additional fields.
   */
  extend(fields: object) {
    assertIsFieldObject(fields);

    return new Schema({ ...this.fields, ...fields });
  }

  /**
   * Creates a new Schema made of selected fields.
   * @param keys List of keys to select.
   * @return A new Schema containing a subset of the fields of this Schema as specified by 'keys'.
   */
  select(...keys) {
    const result = {};
    keys.forEach((key) => {
      result[key] = this.fields[key];
    });
    return new Schema(result);
  }

  /**
   * Deletes unused fields from their respective Schemas and adds them to a new one,
   * in case they needs to be accessed later.
   * @param keys List of keys to remove.
   * @return A new Schema containing only the necessary/used fields of this Schema.
   */
  exclude(...keys) {
    const result = { ...this.fields };
    keys.forEach((key) => {
      delete result[key];
    });
    return new Schema(result);
  }

  /**
   * Verifies that the object 'data' meets all the requirements defined by this schemas fields.
   * @param data the object that we want to validate
   * @returns an object that has been parsed through
   * by calling the parse method on field and had
   * its key value pairs confirmed as being valid
   */

  async validate(data: object) {
    const result = {};
    // data ={id: '123', pass: 'lolol', email: '@gmail.com'}
    const keys = Object.keys(this.fields);

    // fields = [id: new Id, pass: new Pass, email: new Email]
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // id    / pass    /email
      const field = this.fields[key];
      // User.schema.fields.id   = new Id() {dasf.parse}
      // field = new Id(asdf)

      // eslint-disable-next-line no-await-in-loop
      const value = await field.parse(data[key]);
      // field.parse(@gmail.com)
      // if any of the fields are not valid return undefined
      if (value === undefined) {
        this.lastError = `Unexpected parameter '${key} = ${data[key]}' - ${field.lastError}`;
        return undefined;
      }
      // result = {id: parsedId, pass: hashedPass, email: email.toLowerCase()}
      result[key] = value;
    }
    return result; // if all fields are valid return the new object
  }
}

module.exports = Schema;
