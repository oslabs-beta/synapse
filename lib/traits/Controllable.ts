/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import State from "../delegates/State";
import Controller from "../controllers/Controller";
import Schema from "../validators/Schema";
import { mergePaths, parseEndpoint } from "../utilities";

export default class Controllable extends State {
  static root() {
    throw new Error("Classes that extend Controllable must implement the 'root' method.");
  }

  static $expose(endpoint: string, authorizer: Function, target: Function): Function {
    const Class = this;

    const { method, path } = parseEndpoint(endpoint);
    if (!method || !path) {
      throw new Error(`Invalid endpoint '${endpoint}'.`);
    }

    const pattern = mergePaths(Class.root() + path);
    const nexus = target instanceof Controller ? target : new Controller(target);
    nexus.authorizer = authorizer;
    return nexus.expose(method, pattern);
  }

  static $schema(schema: Schema | object, target: Function): Function {
    const nexus = target instanceof Controller ? target : new Controller(target);
    nexus.schema = schema instanceof Schema ? schema : new Schema(schema);
    return nexus;
  }

  static $affect(paths: Array<string>, target: Function): Function {
    const nexus = target instanceof Controller ? target : new Controller(target);
    nexus.dependents = paths;
    return nexus;
  }
}

// decorators:
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
