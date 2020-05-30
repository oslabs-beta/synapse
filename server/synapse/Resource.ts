/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

export {};

const Field = require("./Field");
const Schema = require("./Schema");
const Reply = require("./Reply");
const Manager = require("./Manager");
const Controller = require("./Controller");
const { isCollectionOf } = require("./etc/util");

/**
 *  Represents a RESTful resource exposed by the synapse API
 */
class Resource {
  static schema;

  static endpoints;

  static manager;

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

  static attach(controller: typeof Controller, manager: typeof Manager) {
    const Class = this;

    Object.keys(Class.endpoints || {}).forEach((key: string) => {
      let [method, path] = key.split(" "); // ex. 'GET /:id => [ 'GET, '/:id' ]
      method = method.toLowerCase(); // ex. 'GET' => 'get'
      path = `/${Class.name.toLowerCase()}${path}`; // ex. '/:id' => '/user/:id'

      // add route to controller: ex. controller.declare('get', '/user/:id', ...
      controller.declare(method, path, async (args: object) => {
        let result;

        try {
          result = await Class.endpoints[key](args); // invoke the endpoint method

          // if the result is a Resource or array of Resources, convert it to a reply
          if (result instanceof Resource || isCollectionOf(Resource, result)) {
            result = new Reply(method === "post" ? 201 : 200, result);
          }

          // the result should now be an instance of Reply
          if (!(result instanceof Reply)) {
            console.log(result);
            throw new Error(
              `Unexpected result from endpoint '${method} ${path}'.`
            );
          }
        } catch (err) {
          console.log(err);
          result = Reply.INTERNAL_SERVER_ERROR();
        }

        return result;
      });
    });

    Class.manager = manager;
  }

  static $field(name: string, value: typeof Field) {
    const Class = this;

    if (!(value instanceof Field)) {
      throw new Error("Expected instance of Field.");
    }

    if (!Class.schema) {
      Class.schema = new Schema();
    }

    Class.schema = Class.schema.extend({ [name]: value });
  }

  static $endpoint(path: string, ...middleware: Array<Function>) {
    const Class = this;

    if (typeof path !== "string") {
      throw new Error("Expected path to be a string.");
    }
    if (!isCollectionOf(Function, middleware)) {
      console.log(middleware);
      throw new Error("Expected middleware to be an array of functions.");
    }

    if (!Class.endpoints) {
      Class.endpoints = {};
    }

    // add a new function to the class's 'endpoints' object.
    Class.endpoints[path] = async (...args) => {
      const chain = [...middleware];

      let baton = args; // pass the input arguments to the first function in the chain
      while (chain.length) {
        const current = chain.shift();

        baton = await current(...baton); // then store the return value to be used as input arguments for the next function

        if (!Array.isArray(baton)) {
          break; // if the middleware function did not return an array of arguments, break the chain
        }
      }

      return baton;
    };

    return middleware[middleware.length - 1];
  }

  static $validator(schema: any, wrapped: Function) {
    if (!(schema instanceof Schema)) {
      schema = new Schema(schema);
    }

    return async (data) => {
      const validated = await schema.validate(data);

      if (typeof validated !== "object") {
        return Reply.BAD_REQUEST(schema.lastError);
      }

      return wrapped(validated);
    };
  }

  static $affect(paths: Array<string>, wrapped: Function) {
    const Class = this;

    return (...args: any) => {
      const result = wrapped(...args);

      // if a Manager object is attached to the class, use it to update the affected resource paths
      if (Class.manager) {
        paths.forEach((path) =>
          Class.manager.update(`/${Class.name.toLowerCase()}${path}`)
        );
      }

      return result;
    };
  }

  static Decorators: any = {};
}

/**
 * @param fieldInst An instance of field that will be added to schema.
 * @returns A decorator function which adds the specified Field to the
 * target class's schema, using the name of the targeted property.
 */
function field(value: typeof Field) {
  return (target, name) => {
    target.constructor.$field(name, value);
  };
}

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
function endpoint(path: string, ...middleware: Array<Function>) {
  return (target, name, descriptor) => {
    target.$endpoint(path, ...middleware, descriptor.value);
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
  return (target, name, descriptor) => {
    const method = descriptor.value; // class method to be decorated
    descriptor.value = target.$validator(schema, method);
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
    const method = descriptor.value; // class method to be decorated
    descriptor.value = target.$affect(paths, method);
  };
}

Object.assign(Resource.Decorators, { field, endpoint, validator, affect });

module.exports = Resource;
