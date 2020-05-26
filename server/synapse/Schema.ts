export {};

/*
  
*/
class Schema {
  fields;

  constructor(fields: object = {}) {
    this.fields = fields;
  }

  /*
    returns a new Schema containing all the fields 
    of this schema, plus additional fields.
  */
  extend(fields: object) {
    return new Schema({ ...this.fields, ...fields });
  }

  /* 
    returns a new Schema containing a subset of the 
    fields of this Schema as specified by 'keys'.
  */

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
    const keys = Object.keys(this.fields);
    const obj = {};
    // validate the data's types within the object
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const field = this.fields[key]; // new Id() => some object
      // if any of the fields is not valid return undefined
      const result = await field.parse(data[key]);
      if (result === undefined) return undefined;
      obj[key] = result;
    }
    // if all fields are valid return the new object
    return obj;
  }
}

module.exports = Schema;
