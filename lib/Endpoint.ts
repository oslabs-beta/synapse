/* eslint-disable lines-between-class-members */
/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */
/* eslint-disable import/no-cycle */

import State from "./interface/State";
import Schema from "./Schema";
import Reply from "./Reply";
import Manager from "./Manager";
import { Functor, routeToPath, invokeChain } from "./util";
import { Number as Num } from "./fields";

const evaluate = async (fns, ...args) => {
  const chain = Array.isArray(fns) ? fns : [fns];

  let result;

  try {
    result = await invokeChain(chain, ...args);

    if (!(result instanceof State)) {
      console.log("Unexpected result:", result);
      throw new Error();
    }
  } catch (err) {
    console.log(err);
    result = Reply.INTERNAL_SERVER_ERROR("An error occurred.");
  }

  return result;
};

async function execute(args: object) {
  const result = await evaluate(this.target, args);

  if (!result.isError()) {
    if (this.callback) {
      this.callback(result);
    }

    if (this.method && this.method !== "get") {
      Manager.invalidate(routeToPath(this.route, args));

      // move to resource:
      // (Array.isArray(result) ? result : [result]).forEach((resource) => {
      //   Manager.invalidate(resource.path());
      // });
    }
  }

  return result;
}

export default class Endpoint extends Functor {
  route: string;
  method: string;
  target: Function;
  schema: Schema = new Schema();
  authorizer: Function;
  callback: Function;

  constructor(target: Function) {
    super();
    this.target = target;
  }

  __call__ = async (...args) => {
    const validated = await this.schema.validate(args[0]);

    if (!validated) {
      return Reply.BAD_REQUEST(this.schema.lastError);
    }

    if (this.method !== "get") {
      return execute.apply(this, [validated]);
    }

    return Manager.cache(this.route, validated, () => execute.apply(this, [validated]));
  };

  try = async (args: object) => {
    const chain: Array<Function> = [this];
    if (this.authorizer) {
      chain.unshift(this.authorizer);
    }

    return evaluate(chain, args);
  };
}

// const query = new Query(
//   async () => this.execute(validated),
//   this.route,
//   Buffer.from(JSON.stringify(validated)).toString("base64")
// );

// const ep = new Endpoint(({ a }) => Reply.OK(a));
// ep.schema = new Schema({ a: new Num() });
// ep.authorizer = (args) => (args.a ? [args] : Reply.UNAUTHORIZED());
// ep.callback = (res) => console.log("success!");
// ep.try({ a: 1 }).then((res) => console.log(res));
