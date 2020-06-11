/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import State from "../delegates/State";
import Nexus from "../controllers/Nexus";
import Field from "../validators/Field";
import Schema from "../validators/Schema";
import { mergePaths, parseEndpoint } from "../utilities";

export default class Meta extends State {
  /** An instance of {@linkcode Schema} defining the properties necessary to construct an instance of the derived class. */
  static schema: Schema;

  static root() {
    throw new Error("Classes that extend Meta must implement the 'root' method.");
  }

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
      throw new Error(`Invalid pattern '${pattern}'.`);
    }

    const route = mergePaths(Class.root() + path);
    const nexus = target instanceof Nexus ? target : new Nexus(target);

    return Object.assign(nexus, { authorizer, method, pattern: route });
  }

  static $schema(schema: Schema | object, target: Function): Function {
    const nexus = target instanceof Nexus ? target : new Nexus(target);
    nexus.schema = schema instanceof Schema ? schema : new Schema(schema);
    return nexus;
  }

  static $affect(paths: Array<string>, target: Function): Function {
    const nexus = target instanceof Nexus ? target : new Nexus(target);
    nexus.dependents = paths;
    return nexus;
  }
}

// decorators:
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
