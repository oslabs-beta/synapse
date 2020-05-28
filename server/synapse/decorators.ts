/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

export {};

const express = require("express");
const { Field } = require("./Field");
const Schema = require("./Schema");
const Reply = require("./Reply");
const Resource = require("./Resource");

/**
 * An instance of Resource will have an "endpoints" property(object) that contains endpoint methods.
 * The endpoint method will call the class method targeted by the decorator using the
 * arguments obtained by passing the input arguments through the specified chain of functions 'middleware'.
 * If any middleware functions return an instance of Reply(more info on Reply class here: (***somelink***),
 * the chain will be broken and the target class method will not be invoked.
 * If no middlware functions are provided, a default one will be invoked that condenses the 'query', 'body', and 'params' properties
 * from the express 'request' object into a single object and passes it to the target class method(business logic).
 * @param path Primary HTTP verb + URL endpoint. Ex: 'GET /:id'
 * @param middleware A list of middleware functions(comma separated) to be invoked when receiving a request to a specific endpoint.
 * @returns A decorator function which adds a new endpoint method to the class's static 'endpoints' object.
 */
function endpoint(path: string, ...middleware) {
  // return a decorator function
  return (target, name, descriptor) => {
    if (!target.endpoints) {
      target.endpoints = {};
    }

    // if no middleware functions are provided, add the default one.
    if (middleware.length === 0) {
      middleware.push((req) => {
        return [
          {
            ...req.query,
            ...req.body,
            ...req.params,
          },
        ];
      });
    }

    // add a new function to the target class's 'endpoints' object.
    target.endpoints[path] = async (...args) => {
      // pass the input arguments to the first function in the chain
      let currentArguments = args;
      for (let i = 0; i < middleware.length; i++) {
        // then store the return value to be used as input arguments for the next function
        currentArguments = await middleware[i](...currentArguments);

        // if the middleware function did not return an array of arguments, break the chain
        if (currentArguments instanceof Reply) {
          // if the result was a Reply, return it to the caller
          return currentArguments;
        }

        if (!Array.isArray(currentArguments)) {
          // otherwise throw an error.
          throw new Error("Expected instance of Reply or Array");
        }
      }

      // call the target class method with the final arguments and return the result
      return descriptor.value(...currentArguments);
    };
  };
}

/**
 * @param fieldInst An instance of field that will be added to schema.
 * @returns A decorator function which adds the specified Field to the
 * target class's schema, using the name of the targeted property.
 */
function field(fieldInst: typeof Field) {
  return (target, name) => {
    const Class = target.constructor;
    if (!Class.schema) {
      Class.schema = new Schema();
    }
    Class.schema = Class.schema.extend({ [name]: fieldInst });
  };
}

/**
 * When invoked, the validator function
 * uses the specified schema to validate the input arguments
 * before calling the original target method.
 * @param schema Specific schema that will be used to validate
 * the field that the decorator is wrapped around.
 * @returns Returns a decorator function which wraps the target class method
 * in a validator function. If validation fails - return an instance of Reply class(read more: ***somelink***).
 */
function validator(schema: typeof Schema) {
  return (target, name, descriptor) => {
    const method = descriptor.value; // store reference to original class method

    descriptor.value = async (data) => {
      const validated = await schema.validate(data); // use 'schema' to validate input 'data'

      // if schema.validate does not return an object, then the data is invalid.
      if (typeof validated !== "object") {
        return Reply.BAD_REQUEST(schema.lastError);
      }

      // Otherwise, call the original class method with the validated data.
      return method(validated);
    };
  };
}

/**
 * Denotes that calling the target class method invalidates cached responses from the specified endpoints.
 * @param endpoints
 */
function affect(...endpoints: string) {}

module.exports = { endpoint, field, validator };
