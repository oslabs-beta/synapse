/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import Validatable from "./Validatable";
import Controller from "../control/Controller";
import Schema from "../state/Schema";
import { mergePaths, parseEndpoint, invokeChain } from "../utility";

const toController = (target: Function, props: object = {}) => {
  return Object.assign(target instanceof Controller ? target : new Controller(target), props);
};

export default class Controllable extends Validatable {
  static root() {
    throw new Error("Classes that extend Controllable must implement the 'root' method.");
  }

  static $endpoint(options, target) {
    const controller = new Controller(target);
    if (options.uses) {
      this.$uses(options.uses, controller);
    }
    if (options.affects) {
      this.$affects(options.affects, controller);
    }
    if (options.schema) {
      this.$schema(options.schema, controller);
    }
    if (options.pattern) {
      if (Array.isArray(options.authorizer)) {
        this.$expose(options.pattern, ...options.authorizer);
      } else {
        this.$expose(options.pattern, options.authorizer);
      }
    }
    return controller;
  }

  static $expose(endpoint: string, ...chain: Array<Function>): Function {
    const Class = this;

    const { method, path } = parseEndpoint(endpoint);

    if (!method || !path) {
      throw new Error(`Invalid endpoint '${endpoint}'.`);
    }
    if (!chain.length) {
      throw new Error("Expected at least one function in 'chain'.");
    }

    const target = chain.pop();
    const authorizer = async (args: object) => {
      const result = await invokeChain(chain, args);
      return Array.isArray(result) ? result[0] : result;
    };

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
export const expose = (path: string, ...authorizers: Array<Function>): Function => {
  return (Class, methodName, descriptor) => {
    const method = descriptor.value; // class method to be decorated
    descriptor.value = Class.$expose(path, ...authorizers, method);
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
