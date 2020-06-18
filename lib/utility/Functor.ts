/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */

export default class Functor extends Function {
  __call__: Function;

  constructor() {
    super();
    return Object.setPrototypeOf(
      new Proxy(this, {
        apply(target, _this, args) {
          return target.__call__(...args);
        },
      }),
      new.target.prototype
    );
  }
}
