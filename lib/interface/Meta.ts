/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import { Field, Schema, Endpoint, Manager } from "..";
import { mergePaths, parseEndpoint } from "../util";
import State from "./State";

export default class Meta extends State {
  /** An instance of {@linkcode Schema} defining the properties necessary to construct an instance of the derived class. */
  static schema: Schema;

  static root() {}

  static $field(field: Field, name: string) {
    const Class = this;

    if (!(field instanceof Field)) {
      throw new Error("Expected instance of Field.");
    }

    if (!Class.schema) {
      Class.schema = new Schema();
    }

    Class.schema = Class.schema.extend({ [name]: field });
  }

  static $expose(pattern: string, authorizer: Function, target: Function): Function {
    const Class = this;

    const { method, path } = parseEndpoint(pattern);

    if (!method || !path) {
      throw new Error(`Invalid endpoint pattern '${pattern}'.`);
    }

    const route = mergePaths(Class.root() + path);
    const endpoint = target instanceof Endpoint ? target : new Endpoint(target);

    return Object.assign(endpoint, { authorizer, method, route });
  }

  static $schema(schema: Schema | object, target: Function): Function {
    const Class = this;

    const endpoint = target instanceof Endpoint ? target : new Endpoint(target);
    endpoint.schema = schema instanceof Schema ? schema : new Schema(schema);
    return endpoint;
  }

  static $affect(paths: Array<string>, target: Function): Function {
    const Class = this;

    const endpoint = target instanceof Endpoint ? target : new Endpoint(target);
    endpoint.callback = (result: any) => {
      paths.forEach((path) => Manager.invalidate(mergePaths(Class.root(), path)));
    };
    return endpoint;
  }
}

export const field = (instance: Field): Function => {
  return (target, fieldName) => {
    const Class = target.constructor;
    Class.$field(instance, fieldName);
  };
};

export const expose = (path: string, authorizer: Function = null): Function => {
  return (Class, methodName, descriptor) => {
    const method = descriptor.value; // class method to be decorated
    descriptor.value = Class.$expose(path, authorizer, method);
  };
};

export const schema = (source: Schema | object): Function => {
  return (Class, methodName, descriptor) => {
    const method = descriptor.value; // class method to be decorated
    descriptor.value = Class.$schema(source, method);
  };
};

export const affect = (...paths: Array<string>): Function => {
  return (Class, methodName, descriptor) => {
    const method = descriptor.value; // class method to be decorated
    descriptor.value = Class.$affect(paths, method);
  };
};
