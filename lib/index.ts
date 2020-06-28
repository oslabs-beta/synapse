/* eslint-disable import/extensions */

import Controllable from './abstract/Controllable';
import Router from './control/Router';
import http from './protocol/http';
import sse from './protocol/sse';
import ws from './protocol/ws';
import { requireAll, makeChain } from './utility';

/** Initializes API request handlers from {@linkcode Controllable} type definitions in the given ```directory```.
 * @param directory A directory containing {@linkcode Controllable} type definitions.
 * @returns An object containing properties ```ws```, ```http```, and ```sse```, whose values are request handlers for the respective protocol.
 */
export function synapse(directory: string, peers: Array<string> = [], pattern: Array<string> = []): object {
  const router = new Router();

  requireAll(directory).forEach((module) => {
    if (module) {
      const Type = module.default || module;
      if (Type.prototype instanceof Controllable) {
        router.declare('use', '/', Type.router);
      }
    }
  });

  const callback: any = makeChain();

  return {
    http: http(router, callback),
    sse: sse(router, callback),
    ws: ws(router, callback, peers, pattern),
    use: callback.add,
  };
}

export { default as State } from './State';
export { default as Resource } from './Resource';
export { default as Collection } from './Collection';
export { default as Field } from './Field';
export { default as Schema } from './Schema';

export * as abstract from './abstract';
export * as control from './control';
export * as decorators from './abstract/@';
export * as fields from './fields';
export * as protocol from './protocol';
export * as utility from './utility';
