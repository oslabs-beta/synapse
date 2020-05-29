/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

export {};

const Field = require("./Field");
const Schema = require("./Schema");
const Reply = require("./Reply");
const { isCollectionOf } = require("./etc/util");

/**
 * An instance of Resource will have an "endpoints" property(object) that contains endpoint methods.
 * The endpoint method will call the class method targeted by the decorator using the
 * arguments obtained by passing the input arguments through the specified chain of functions 'middleware'.
 * If any middleware functions return an instance of Reply(more info on Reply class here: (***somelink***),
 * the chain will be broken and the target class method will not be invoked.
 * @param path Primary HTTP verb + URL endpoint. Ex: 'GET /:id'
 * @param middleware A list of middleware functions(comma separated) to be invoked when receiving a request to a specific endpoint.
 * @returns A decorator function which adds a new endpoint method to the class's static 'endpoints' object.
 */
function endpoint(path: string, ...middleware) {
  if (typeof path !== "string") {
    throw new Error("Expected argument 1 to be a string");
  }
  if (!isCollectionOf(Function, middleware)) {
    throw new Error("Middleware must be functions");
  }

  // return a decorator function
  return (target, name, descriptor) => {
    if (!target.endpoints) {
      target.endpoints = {};
      target.map = {};
    }

    // add a new function to the target class's 'endpoints' object.
    target.map[name] = path;
    target.endpoints[path] = async (...args) => {
      // pass the input arguments to the first function in the chain
      let currentArguments = args;
      for (let i = 0; i < middleware.length; i++) {
        // then store the return value to be used as input arguments for the next function
        currentArguments = await middleware[i](...currentArguments);

        // if the middleware function did not return an array of arguments, break the chain
        if (currentArguments instanceof Reply) {
          // if the result was a Reply, return it to the caller
          return currentArguments;
        }

        if (!Array.isArray(currentArguments)) {
          // otherwise throw an error.
          throw new Error("Expected instance of Reply or Array");
        }
      }

      // call the target class method with the final arguments and return the result
      return descriptor.value(...currentArguments);
    };
  };
}

/**
 * @param fieldInst An instance of field that will be added to schema.
 * @returns A decorator function which adds the specified Field to the
 * target class's schema, using the name of the targeted property.
 */
function field(fieldInst: typeof Field) {
  if (!(fieldInst instanceof Field)) {
    throw new Error("Expected intsance of Field");
  }

  return (target, name) => {
    const Class = target.constructor;
    if (!Class.schema) {
      Class.schema = new Schema();
    }
    Class.schema = Class.schema.extend({ [name]: fieldInst });
  };
}

/**
 * When invoked, the validator function
 * uses the specified schema to validate the input arguments
 * before calling the original target method.
 * @param schema Specific schema that will be used to validate
 * the field that the decorator is wrapped around.
 * @returns Returns a decorator function which wraps the target class method
 * in a validator function. If validation fails - return an instance of Reply class(read more: ***somelink***).
 */
function validator(schema: typeof Schema) {
  if (!(schema instanceof Schema)) {
    schema = new Schema(schema);
  }

  return (target, name, descriptor) => {
    const method = descriptor.value; // store reference to original class method

    descriptor.value = async (data) => {
      const validated = await schema.validate(data); // use 'schema' to validate input 'data'

      // if schema.validate does not return an object, then the data is invalid.
      if (typeof validated !== "object") {
        return Reply.BAD_REQUEST(schema.lastError);
      }

      // Otherwise, call the original class method with the validated data.
      return method(validated);
    };
  };
}

/**
 * Used as a decorator to wrap the target class method in a function which, when invoked,
 * attempts to invalidate cached values for specified resource 'paths'.
 * @param paths the paths of resources whose state depends on this resource
 * @returns A decorator function
 */
function affect(...paths: Array<string>) {
  return (target, name, descriptor) => {
    const method = descriptor.value; // store reference to original class method

    descriptor.value = (...args) => {
      const result = method(...args); // call original class method

      // if a Manager object is attached to the class, use it to update the affected resource paths
      if (target.manager) {
        paths.forEach((path) =>
          target.manager.update(`/${target.name.toLowerCase()}${path}`)
        );
      }

      return result;
    };
  };
}

/**
 *  Represents a RESTful resource exposed by the synapse API
 */
class Resource {
  static Decorators = { field, endpoint, validator, affect };

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
