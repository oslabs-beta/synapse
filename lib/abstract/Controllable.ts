/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import Validatable from "./Validatable";
import Controller from "../control/Controller";
import Schema from "../state/Schema";
import { mergePaths, parseEndpoint } from "../utility";

const toController = (target: Function, props: object = {}) => {
  return Object.assign(target instanceof Controller ? target : new Controller(target), props);
};

export default class Controllable extends Validatable {
  static root() {
    throw new Error("Classes that extend Controllable must implement the 'root' method.");
  }

  static $expose(endpoint: string, authorizer: Function, target: Function): Function {
    const Class = this;

    const { method, path } = parseEndpoint(endpoint);
    if (!method || !path) {
      throw new Error(`Invalid endpoint '${endpoint}'.`);
    }

    const pattern = mergePaths(Class.root(), path);
    return toController(target, { authorizer }).expose(method, pattern);
  }

  static $schema(from: Schema | object, target: Function): Function {
    const Class = this;
    const schema = from instanceof Schema ? from : new Schema(from);
    return toController(target, { schema });
  }

  static $affects(paths: Array<string>, target: Function): Function {
    const Class = this;
    const root = Class.root();
    const dependents = paths.map((path) => mergePaths(root, path));
    return toController(target, { dependents });
  }

  static $uses(paths: Array<string>, target: Function): Function {
    const Class = this;
    const root = Class.root();
    const dependencies = paths.map((path) => mergePaths(root, path));
    return toController(target, { dependencies });
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

export const affects = (...paths: Array<string>): Function => {
  return (Class, methodName, descriptor) => {
    const method = descriptor.value; // class method to be decorated
    descriptor.value = Class.$affects(paths, method);
  };
};

export const uses = (...paths: Array<string>): Function => {
  return (Class, methodName, descriptor) => {
    const method = descriptor.value; // class method to be decorated
    descriptor.value = Class.$uses(paths, method);
  };
};
