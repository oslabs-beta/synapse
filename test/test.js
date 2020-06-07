/* eslint-disable class-methods-use-this */
/* eslint-disable func-names */
/* eslint-disable no-param-reassign */

const querystring = require("querystring");

// function gatekeeper(pre, post) {
//   function result(...args) {
//     args = pre(...args);

//     if (!Array.isArray(args)) return null;

//     return post(...args);
//   }
//   result.probe = (...args) => {
//     args = pre(...args);

//     if (!Array.isArray(args)) return null;

//     if (post instanceof gatekeeper) {
//       return post.probe(...args);
//     }

//     return Object.assign(
//       function () {
//         return post(...args);
//       },
//       { args }
//     );
//   };
//   return Object.setPrototypeOf(result, gatekeeper.prototype);
// }

// const inner = gatekeeper(
//   ({ a, b }) => (a && b ? [a, b] : null),
//   (a, b) => console.log(a * b)
// );

// const outer = gatekeeper((...args) => {
//   console.log("endpoint");
//   return args;
// }, inner);

// const fn = outer.probe({ a: 2, b: 3 });
// console.log(fn());

class Middleware extends Function {
  constructor(pre, post, props = {}, meta = null) {
    super();

    function instance(...args) {
      const result = pre(...args);

      if (!Array.isArray(result)) {
        return result;
      }

      return post(...result);
    }

    instance.probe = (...args) => {
      const result = pre(...args);

      if (!Array.isArray(result)) {
        return result;
      }

      if (post instanceof Middleware) {
        return post.probe(...result);
      }

      return Object.assign(
        function () {
          return post(...result);
        },
        meta ? meta(...result) : {}
      );
    };

    Object.assign(instance, post instanceof Middleware ? post : {}, props);

    return Object.setPrototypeOf(instance, Middleware.prototype);
  }
}

const inner = new Middleware(
  ({ a, b }) => (a && b ? [a, b] : "error"),
  (a, b) => a * b,
  { schema: "schema" },
  (...args) => ({ args })
);

const outer = new Middleware(
  (...args) => {
    console.log("endpoint");
    return args;
  },
  inner,
  { endpoint: "endpoint" }
);

const querier = {
  encode: (path, args) => (path ? `${path}?${querystring.encode(args)}` : null),
  decode: (path, query) => {
    const qs = query.split(`${path}?`)[1];
    return qs !== undefined ? querystring.decode(qs) : null;
  },
};

console.log(querier.decode("/user/", "/user/?"));
