export {};

const fs = require("fs");

/**
 * Verifies that all elements of the input collection are of type 'Type'.
 * @param Type A constructor function
 * @param col The object or array to search
 * @param assert If true, the function will throw an error in case of false result.
 * @returns A boolean
 */
const isCollectionOf = (Type: Function, col: object, assert: boolean = false) => {
  if (!Array.isArray(col)) {
    return false;
  }
  for (let i = 0; i < col.length; ++i) {
    if (!(col[i] instanceof Type)) {
      if (assert) {
        throw new Error(`Expected collection containing only values of type ${Type.name}.`);
      }
      return false;
    }
  }
  return true;
};

const tryParseJSON = (json: string) => {
  try {
    return JSON.parse(json);
  } catch (err) {
    return undefined;
  }
};

const requireAll = (path: string) => {
  const files = fs.readdirSync(path);
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return files.map((file: string) => require(`${path}/${file}`));
};

const parseEndpoint = (endpoint: string, custom = []) => {
  // eslint-disable-next-line prefer-const
  let [method, path] = endpoint.split(" ");

  method = method.toLowerCase();

  const standard = ["get", "post", "put", "patch", "delete"];
  if (!standard.includes(method) && !custom.includes(method)) {
    return {};
  }

  return { method, path };
};

module.exports = { isCollectionOf, tryParseJSON, requireAll, parseEndpoint };
