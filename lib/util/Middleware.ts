/* eslint-disable no-empty-function */
/* eslint-disable func-names */
/* eslint-disable class-methods-use-this */

export default class Middleware extends Function {
  static merge(...middlware: Array<Function>): Middleware {
    if (middlware.length < 2) {
      throw new Error("Expected 2 or more functions.");
    }

    let result = middlware.pop();
    while (middlware.length) {
      result = new Middleware(middlware.shift(), result);
    }

    return <Middleware>result;
  }

  constructor(pre: Function, post: Function, props: object = {}, meta: Function = null) {
    super();

    async function instance(...args) {
      const result = await pre(...args);

      if (!Array.isArray(result)) {
        return result;
      }

      return post(...result);
    }

    instance.probe = async (...args) => {
      const result = await pre(...args);

      if (!Array.isArray(result)) {
        return result;
      }

      if (post instanceof Middleware) {
        return post.probe(...result);
      }

      return Object.assign(
        async function () {
          return post(...result);
        },
        meta ? meta(...result) : {}
      );
    };

    Object.assign(instance, post instanceof Middleware ? post : {}, props);

    return Object.setPrototypeOf(instance, Middleware.prototype);
  }

  async probe(...args) {}
}
