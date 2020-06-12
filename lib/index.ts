/* eslint-disable import/extensions */

import http from "./protocol/http";
import sse from "./protocol/sse";
import ws from "./protocol/ws";
import Router from "./utility/Router";
import { requireAll } from "./utility";

/** Initializes API request handlers from {@linkcode Resource} definitions in the given ```directory```.
 * @param directory A directory containing {@linkcode Resource} definitions.
 * @returns An object containing properties ```ws```, ```http```, and ```sse```, whose values are request handlers for the respective protocol.
 */
export function synapse(directory: string): object {
  requireAll(directory);

  const chain = [];
  const callback = async (req, res) => {
    let index = 0;
    const next = () => {
      if (index < chain.length) {
        chain[index++](req, res, next);
      }
    };
    next();
  };

  return {
    http: http(callback),
    sse: sse(callback),
    ws: ws(callback),
    use: (...middleware) => chain.push(...middleware),
  };
}

export { default as State } from "./control/State";
export { default as Resource } from "./state/Resource";
export { default as Collection } from "./state/Collection";
export { default as Field } from "./state/Field";
export { default as Schema } from "./state/Schema";
