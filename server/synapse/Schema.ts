/* eslint-disable no-await-in-loop */
export {};

const { Field } = require("./Field");

/*
  checks that all values in 'obj' are of type Field,
  and throws an exception if not.
*/
const assertIsFieldObject = (obj: object) => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; ++i) {
    if (!(obj[keys[i]] instanceof Field)) {
      throw new Error("Expected object containing only values of type Field.");
    }
  }
  return true;
};

/*
  Defines a type of object as a set of key names
  and value types (Fields). Can validate that a
  given object meets its requirements.
*/
class Schema {
  fields: object;

  lastError: string;

  constructor(fields: object = {}) {
    assertIsFieldObject(fields);

    this.fields = fields;
  }

  /*
    returns a new Schema containing all the fields 
    of this schema, plus additional fields.
  */
  extend(fields: object) {
    assertIsFieldObject(fields);

    return new Schema({ ...this.fields, ...fields });
  }

  /* 
    returns a new Schema containing a subset of the 
    fields of this Schema as specified by 'keys'.
  */
<<<<<<< HEAD

=======
>>>>>>> 3c80fda9be6370fb4b7acf497a5cd76464e8b5f8
  select(...keys) {
    const result = {};
    keys.forEach((key) => {
      result[key] = this.fields[key];
    });
    return new Schema(result);
  }

  /* 
    returns a new Schema containing all the fields
    of this Schema except those specified by 'keys'
  */
  exclude(...keys) {
    const result = { ...this.fields };
    keys.forEach((key) => {
      delete result[key];
    });
    return new Schema(result);
  }

  /*
    verifies that the object 'data' meets all the 
    requirements defined by this schemas fields.
  */
  async validate(data: object) {
    const result = {};

    const keys = Object.keys(this.fields);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const field = this.fields[key];

      // eslint-disable-next-line no-await-in-loop
      const value = await field.parse(data[key]);

      // if any of the fields are not valid return undefined
      if (value === undefined) {
        this.lastError = `Unexpected parameter '${key} = ${data[key]}'.`;
        return undefined;
      }
      result[key] = value;
    }

    return result; // if all fields are valid return the new object
  }
}

module.exports = Schema;
