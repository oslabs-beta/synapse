export {};

/**
 *  Represents a RESTful resource exposed by the synapse API
 */
class Resource {
  /**
   * Creates an instance of the derived class using a plain object 'data'.
   * Validates the data using the derived class's schema.
   *
   * @param data A plain object that contains "raw" information that will be used to make a resource. Ex: User.create({name: 'Jay', pass: 'password'})
   * @returns An instance of the derived class. Ex: User object with [name] validated, and [password] hashed: {name: 'Jay', pass: '$2b$10$3euPcmQFCiblsZeEu5s7p'}
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
    const instance = new Type(); // new User(id: 123, email: xxninjamasterxx@gmail.com(!!!), pass: HASDHASHDASH)
    Object.keys(result).forEach((key) => {
      instance[key] = result[key];
    });

    return instance;
  }
}

module.exports = Resource;
