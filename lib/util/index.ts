/* eslint-disable valid-typeof */
/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */
import * as fs from "fs";

/**
 * Verifies that all elements of the input collection are of type 'Type'.
 * @param Type A constructor function
 * @param col The object or array to search
 * @param assert If true, the function will throw an error in case of false result.
 * @returns A boolean
 */
export const isCollectionOf = (type: any, col: object, assert: boolean = false) => {
  if (!Array.isArray(col)) {
    return false;
  }
  for (let i = 0; i < col.length; ++i) {
    const invalid =
      (typeof type === "string" && typeof col[i] !== type) ||
      (typeof type === "function" && !(col[i] instanceof type));

    if (invalid) {
      if (assert) {
        throw new Error(`Expected collection containing only values of type ${type}.`);
      }
      return false;
    }
  }
  return true;
};

export const tryParseJSON = (json: string) => {
  try {
    return JSON.parse(json);
  } catch (err) {
    return undefined;
  }
};

export const requireAll = (path: string) => {
  const files = fs.readdirSync(path);
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return files.map((file: string) => require(`${path}/${file}`));
};

export const parseEndpoint = (endpoint: string, custom: Array<string> = [], root: string = "") => {
  let [method, path] = endpoint.split(" ");

  method = method.toLowerCase();
  path = root + path;

  const standard = ["get", "post", "put", "patch", "delete"];
  if (!standard.includes(method) && !custom.includes(method)) {
    return {};
  }

  return { method, path };
};

export const invokeChain = async (middleware: Array<Function>, ...args) => {
  const chain = [...middleware];

  let baton = args; // pass the input arguments to the first function in the chain
  while (chain.length) {
    const current = chain.shift();

    // eslint-disable-next-line no-await-in-loop
    baton = await current(...baton); // then store the return value to be used as input arguments for the next function

    if (!Array.isArray(baton)) {
      break; // if the middleware function did not return an array of arguments, break the chain
    }
  }

  return baton;
};

export { default as Controller } from "./Controller";
export { default as Relation } from "./Relation";
export { default as Store } from "./Store";
export { default as Middleware } from "./Middleware";
