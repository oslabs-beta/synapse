/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import { Field, Schema, Reply, Controller, Manager } from ".";
// import Schema from "./Schema";
// import Manager from "./Manager";
// import Field from "./Field";
// import Controller from "./Controller";
// import Reply from "./Reply";
import Id from "./fields/Id";
import { isCollectionOf } from "./util";

/** Abstract class representing a RESTful resource exposed by the synapse API. */
export default class Resource {
  /** An instance of {@linkcode Schema} defining the properties necessary to construct an instance of the derived class. */
  static schema: Schema;

  /** An object mapping API _endpoints_ in the format ```METHOD /path``` to handler functions. */
  static endpoints: object;

  /** The instance of {@linkcode Manager} that is currently managing the derived class. */
  static manager: Manager;

  /** Returns the _resource path_ from which all endpoints on the derived class originate. */
  static root(): string {
    const Class = this;

    const name = Class.name
      .split(/(?=[A-Z])/)
      .join("_")
      .toLowerCase();
    return `/${name}`;
  }

  /** Returns the _resource path_ that uniquely locates the instance (i.e. the path to which a ```GET``` request would return the instance). By default, this is the {@linkcode Resource.root|root} path followed by the value on the instance corresponding to the first field on the derived class's schema that extends type {@linkcode Id} (e.g. '/user/123'); however, derived classes may override this behavior. */
  path(): string {
    const Class = <typeof Resource>this.constructor;

    const { fields } = Class.schema;
    const keys = Object.keys(fields);
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (fields[key] instanceof Id) {
        return `${Class.root()}/${this[key]}`;
      }
    }

    throw new Error(`No field of type 'Id' found for class ${Class.name}.`);
  }

  /** _**(async)**_ Attempts to create a new instance of the derived class from the plain object ```data```. Throws an ```Error``` if ```data``` cannot be validated using the derived class's {@linkcode Resource.schema|schema}.
   * @param data The key-value pairs from which to construct the {@linkcode Resource} instance.
   */
  static async instantiate(data: object): Promise<Resource> {
    const Type: any = this; // 'this' represents the class constructor in a static method.

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

  /** Exposes all {@linkcode Resource.endpoints|endpoints} defined by the derived class to the specified ```controller```. Sets the derived class's {@linkcode Resource.manager|manager}.
   * @param controller The controller which will receive the endpoints.
   * @param manager See {@linkcode Resource.manager}.
   */
  static attach(controller: Controller, manager: Manager): void {
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
            throw new Error(`Unexpected result from endpoint '${method} ${path}'.`);
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

  /** Adds a field to the derived class's {@linkcode Resource.schema|schema}.
   * @category Meta
   * @param name The name of the field.
   * @param value An instance of {@linkcode Field}.
   */
  static $field(name: string, value: Field): void {
    const Class = this;

    if (!(value instanceof Field)) {
      throw new Error("Expected instance of Field.");
    }

    if (!Class.schema) {
      Class.schema = new Schema();
    }

    Class.schema = Class.schema.extend({ [name]: value });
  }

  /** Adds an _endpoint_ to the derived class's {@linkcode Resource.endpoints|endpoints} object.
   * @category Meta
   * @param value The _endpoint_ string.
   * @param middleware A chain of functions to be executed when the _endpoint_ is requested. The return value of each function will be passed to the next in line.
   * @returns The last function in the middleware chain.
   */
  static $endpoint(value: string, ...middleware: Array<Function>): Function {
    const Class = this;

    if (typeof value !== "string") {
      throw new Error("Expected 'value' to be a string.");
    }
    if (!isCollectionOf(Function, middleware)) {
      console.log(middleware);
      throw new Error("Expected 'middleware' to be an array of functions.");
    }

    if (!Class.endpoints) {
      Class.endpoints = {};
    }

    // add a new function to the class's 'endpoints' object.
    Class.endpoints[value] = async (...args) => {
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

  /** Returns a function which, when invoked, will validate its input arguments using the specified ```schema``` before calling the specified```target``` function.
   * @category Meta
   * @param schema An instance of {@linkcode Schema}, or a _fieldset_ which will be used to construct a schema.
   * @param target The function to be wrapped.
   * @returns The validator function.
   */
  static $validator(schema: any, target: Function): Function {
    if (!(schema instanceof Schema)) {
      schema = new Schema(schema);
    }

    return async (data) => {
      const validated = await schema.validate(data);

      if (typeof validated !== "object") {
        return Reply.BAD_REQUEST(schema.lastError);
      }

      return target(validated);
    };
  }

  /** Returns a function which, when invoked, will first call the ```target``` function and then attempt to notify the derived class's {@linkcode Resource.manager|manager} that the specified _resource ```paths```_ should be updated.
   * @category Meta
   * @param paths The dependent _resource paths_.
   * @param target The function to be wrapped.
   */
  static $affect(paths: Array<string>, target: Function): Function {
    const Class = this;

    return (...args: any) => {
      const result = target(...args);

      // if a Manager object is attached to the class, use it to update the affected resource paths
      if (Class.manager) {
        paths.forEach((path) => Class.manager.notify(Class.root() + path));
      }

      return result;
    };
  }
}

export const field = (instance: Field): Function => {
  return (target, fieldName) => {
    const Class = target.constructor;
    Class.$field(fieldName, instance);
  };
};

export const endpoint = (path: string, ...middleware: Array<Function>): Function => {
  return (Class, methodName, descriptor) => {
    Class.$endpoint(path, ...middleware, descriptor.value);
  };
};

export const validator = (schema: any): Function => {
  return (Class, methodName, descriptor) => {
    const method = descriptor.value; // class method to be decorated
    descriptor.value = Class.$validator(schema, method);
  };
};

export const affect = (...paths: Array<string>): Function => {
  return (Class, methodName, descriptor) => {
    const method = descriptor.value; // class method to be decorated
    descriptor.value = Class.$affect(paths, method);
  };
};
