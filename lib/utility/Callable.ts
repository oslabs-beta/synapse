/* eslint-disable no-underscore-dangle */

export default class Callable extends Function {
  __call__: Function;

  constructor(fn: Function = null) {
    super("return arguments.callee.__call__.apply(arguments.callee, arguments)");

    this.__call__ = fn || (() => {});
  }
}
