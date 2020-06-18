/* eslint-disable import/extensions */

import Controller from "./control/Controller";
import http from "./protocol/http";
import sse from "./protocol/sse";
import ws from "./protocol/ws";
import { requireAll, makeChain } from "./utility";

/** Initializes API request handlers from {@linkcode Resource} definitions in the given ```directory```.
 * @param directory A directory containing {@linkcode Resource} definitions.
 * @returns An object containing properties ```ws```, ```http```, and ```sse```, whose values are request handlers for the respective protocol.
 */
export function synapse(directory: string, peers: Array<string> = [], pattern: Array<string> = []): object {
  requireAll(directory);

  const callback: any = makeChain();

  return {
    http: http(callback),
    sse: sse(callback),
    ws: ws(callback, peers, pattern),
    use: callback.add,
  };
}

export { default as State } from "./control/State";
export { default as Resource } from "./state/Resource";
export { default as Collection } from "./state/Collection";
export { default as Field } from "./state/Field";
export { default as Schema } from "./state/Schema";

export * as fields from "./fields";
export * as decorators from "./@";
