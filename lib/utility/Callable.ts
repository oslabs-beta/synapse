/* eslint-disable no-underscore-dangle */

/** Defines a callable object. */
export default class Callable extends Function {
  /** The function that will be executed when the instance is invoked. */
  __call__: Function;

  constructor(fn: Function = null) {
    super('return arguments.callee.__call__.apply(arguments.callee, [this, ...arguments])');

    this.__call__ = fn || (() => { });
  }
}
