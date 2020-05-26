/* eslint-disable no-param-reassign */

export {};

const express = require('express');
const { Field } = require('./Field');
const Schema = require('./Schema');
const Reply = require('./Reply');
const Resource = require('./Resource');

function endpoint(path: string, ...middleware) {
  return (target, name, descriptor) => {
    if (!target.endpoints) {
      target.endpoints = {};
    }

    if (middleware.length === 0) {
      middleware.push((req, res) => {
        return [
          {
            ...req.query,
            ...req.body,
            ...req.params,
          },
        ];
      });
    }

    middleware.push(descriptor.value);

    target.endpoints[path] = (...args) => {
      let currentArguments = args;
      for (let i = 0; i < middleware.length; i++) {
        currentArguments = middleware[i](...currentArguments);
        if (currentArguments instanceof Reply) {
          break;
        }
      }
      return currentArguments;
    };
  };
}

function field(fieldArg: typeof Field) {
  return (target, name, descriptor) => {
    const Type = target.constructor;
    if (!Type.schema) {
      Type.schema = new Schema();
    }
    Type.schema = Type.schema.extend({ [name]: fieldArg });
  };
}

function validator(schema: typeof Schema) {
  return (target, name, descriptor) => {
    const method = descriptor.value; // store reference to original class method

    descriptor.value = async (data) => {
      const validated = await schema.validate(data); // use 'schema' to validate input 'data'

      // if schema.validate does not return an object, then the data is invalid.
      if (typeof validated !== 'object') {
        return Reply.BAD_REQUEST();
      }

      // Otherwise, call the original class method with the validated data.
      return method(validated);
    };
  };
}

module.exports = { endpoint, field, validator };
