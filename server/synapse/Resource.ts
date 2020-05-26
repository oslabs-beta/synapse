export {};
<<<<<<< HEAD
const Schema = require('./Schema');
=======
>>>>>>> 3c80fda9be6370fb4b7acf497a5cd76464e8b5f8

/*
  Represents a RESTful resource exposed by the synapse API
*/
class Resource {
  /*
    Creates an instance of the derived class using
    a plain object 'data'. Validates the data using
    the derived class's schema.
  */
  static async create(data: object) {
    // 'this' represents the class constructor in a static method.
    const Type: any = this;

    // validate in the input data using the derived class's schema.
    const result = await Type.schema.validate(data);
    if (!result) {
      throw new Error(Type.schema.lastError);
    }

    // transfer the resulting values to a new instance of the derived class
    const instance = new Type();
    Object.keys(result).forEach((key) => {
      instance[key] = result[key];
    });

    return instance;
  }
}

module.exports = Resource;
