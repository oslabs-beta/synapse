/* eslint-disable func-names */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import * as querystring from "querystring";
import { Field, Schema, Reply, Manager } from ".";
import { isCollectionOf, parseEndpoint, invokeChain, Middleware } from "./util";
import Controller from "./util/Controller";
import Id from "./fields/Id";

const querier = {
  encode: (path, args) => (path ? `${path}?${querystring.encode(<any>args)}` : null),
  decode: (path, query) => {
    const qs = query.split(`${path}?`)[1];
    return qs !== undefined ? querystring.decode(qs) : null;
  },
};

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
  static async instantiate<T extends typeof Resource>(this: T, data: object): Promise<InstanceType<T>> {
    const Type: any = this; // 'this' represents the class constructor in a static method.

    // validate in the input data using the derived class's schema.
    const result = await Type.schema.validate(data);
    if (!result) {
      console.log(data);
      throw new Error(Type.schema.lastError);
    }

    // transfer the resulting values to a new instance of the derived class
    const instance = new Type();
    Object.keys(result).forEach((key) => {
      instance[key] = result[key];
    });

    return instance;
  }

  static serialize(resource: Resource | Array<Resource>): any {
    if (resource instanceof Resource) {
      return { [resource.path()]: { ...resource } };
    }

    if (isCollectionOf(Resource, resource, true)) {
      return resource.map((el) => Resource.serialize(el));
    }

    return undefined;
  }

  /** Exposes all {@linkcode Resource.endpoints|endpoints} defined by the derived class to the specified ```controller```. Sets the derived class's {@linkcode Resource.manager|manager}.
   * @param controller The controller which will receive the endpoints.
   * @param manager See {@linkcode Resource.manager}.
   */
  static attach(controller: Controller, manager: Manager): void {
    const Class = this;

    Class.manager = manager;

    if (!Class.endpoints) {
      Class.endpoints = {};
    }

    Object.keys(Class.endpoints).forEach((key: string) => {
      const { method, path } = parseEndpoint(key, [], Class.root());
      controller.declare(method, path, Class.endpoints[key]);
    });
  }

  /** Returns a new {@linkcode Schema} containing all the fields of the derived class's schema plus all fields defined on the schemas of each {@linkcode Resource} type in ```Classes```. In case of a collision between field names, precedence will be given to latter {@linkcode Resource|Resources} in ```Classes```, with highest precedence given to the derived class on which the method was called.
   * @param Classes The {@linkcode Resource}
   */
  static union(...Classes: Array<{ new (): Resource }>): Schema {
    const fields = [];
    Classes.forEach((Class: typeof Resource) => {
      if (Class.prototype instanceof Resource) {
        fields.push(Class.schema.fields);
      }
    });

    const Class = <typeof Resource>this;
    return new Schema(Object.assign({}, ...fields, Class.schema.fields));
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
  static $endpoint(value: string, target: Middleware): Function {
    const Class = this;
    const { method, path } = parseEndpoint(value);

    if (!method) {
      throw new Error(`Invalid endpoint '${value}'.`);
    }

    if (!Class.endpoints) {
      Class.endpoints = {};
    }

    // add a new function to the class's 'endpoints' object.
    Class.endpoints[value] = async (arg, rpath) => {
      let result;

      try {
        if (typeof arg === "object") {
          if (method === "get") {
            const probe: any = target.probe ? await target.probe(arg) : {};

            if (!probe.args) {
              probe.args = {};
            }

            return querier.encode(rpath, probe.args);
          }

          result = await target(arg);
        } else if (typeof arg === "string") {
          const query = querier.decode(rpath, arg);

          if (!query) {
            result = Reply.BAD_REQUEST();
          } else {
            result = await target(query);
          }
        }

        // if the result is a Resource or array of Resources, convert it to a reply
        if (result instanceof Resource || isCollectionOf(Resource, result)) {
          result = new Reply(method === "post" ? 201 : 200, result);
        }

        // the result should now be an instance of Reply
        if (!(result instanceof Reply)) {
          console.log("Unexpected result: ", result);
          throw new Error(`Unexpected result from endpoint '${value}'.`);
        }
      } catch (err) {
        console.log("INTERNAL_SERVER_ERROR: ", err);
        result = Reply.INTERNAL_SERVER_ERROR(); // any unhandled errors produce a generic 500 reply
      }

      return result;
    };

    return async (args) => {
      if (!Class.manager) {
        return undefined;
      }
      return Class.manager.execute(path, [method, args]);
    };
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

    return new Middleware(
      async (...args) => {
        const validated = await schema.validate(args[0] || {});
        if (typeof validated !== "object") {
          return Reply.BAD_REQUEST(schema.lastError);
        }
        return [validated];
      },
      target,
      { schema },
      (args) => ({ args })
    );
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
    const method = descriptor.value; // class method to be decorated
    descriptor.value = Class.$endpoint(path, method);
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
