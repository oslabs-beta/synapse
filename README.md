# synapse

Real-Time API Library

- Documentation: http://synapsejs.org/docs

## Table of Contents

- [Overview](#overview)

- [Getting Started](#getting-started)

  - [Defining Resources](#defining-resources)

  - [Server Setup](#server-setup)

- [Intermediate Topics](#intermediate-topics)

  - [Schema Manipulation](#schema-manipulation)

  - [Authorization](#authorization)

  - [Resource Dependencies](#resource-dependencies)

  - [Clustering](#clustering)

- [Advanced Topics](#advanced-topics)

  - [Data Model](#data-model)

  - [Control Flow](#control-flow)

- [Authors](#authors)

## Overview

Building scalable and secure APIs is an immense challenge in-and-of-itself, and adding real-time functionality to an existing API only increases the complexity, often necessitating significant refactoring. Synapse attempts to solve this problem by providing a high-level, protocol-agnostic abstraction of a REST API. It allows resources to be defined once and served over multiple protocols, including HTTP, WebSockets, and SSE, while managing input validation and normalization as well as response caching under-the-hood. The library integrates seamlessly with Express, and can be used as much or as little as needed to add real-time functionality to an existing application or to build an entire API from scratch.

Synapse applications are composed of _Resources_ -- classes that model resources as defined by the RESTful architectural style. In this sense, resources represent collections of data that are exposed by the API (ex. ```User```, ```Comment```, ```Session```). Each resource defines a _Schema_ composed of _Fields_, where fields are data types with specific requirements that can be validated (ex. ```EmailAddress```, ```Password```, ```Number```, etc.) and schemas are collections of fields representing a set of parameters by name (ex. ```{ email: EmailAddress, password: Password, age: Number }```). A resource’s schema, then, defines the data necessary to construct an instance of that type.

Classes that extend Resource can also define static methods and expose them to the API. In TypeScript, this is accomplished using various decorators to attach information to the method, like its HTTP endpoint. For example, a class ```User``` might expose an endpoint method called ```register``` to ```POST /user```. Each endpoint method also defines a schema, which determines exactly what data will be passed from each HTTP request to the method, and also ensures that all arguments are validated before the method is invoked. Under the hood, these decorators convert the decorated method to an instance of _Controller_, which applications not written in TypeScript can use to achieve the same functionality. See the documentation for more details.

Under the hood, Synapse uses these resource definitions to serve data produced by endpoint methods to clients in a protocol-independent manner, simplifying the process of adding real-time support to an application. By maintaining an in-memory cache of all requested data, it can also manage subscriptions to any cacheable endpoint and automatically push updates to clients whenever the cached state changes.

## Getting started

This guide will assume that you have already set up an Express project. To learn more about Express, [click here](#).

1. Begin by installing the [npm package](https://www.npmjs.com/package/@synapsejs/synapse) by running the following command from your project directory:

```javascript
npm i @synapsejs/synapse
```

#### Defining Resources

Consider the following hypothetical User class modeling a user stored in a MongoDB `collection`. Instances of User have 4 properties: `_id`, `username`, `email` and `password`, while the User class provides 2 static methods for finding and creating User instances in the database.

```javascript
class User {
  _id;
  username;
  email;
  password;

  static async find(_id) {
    const document = await collection.findById({ _id });
    ...
  }

  static async register(username, email, password) {
    const document = await collection.create({ username, email, password });
    ...
  }
}
```

In order to allow this resource to be served by the synapse API, we will have to make a few changes to the class definition.

1. Begin by importing the Resource base class and necessary Fields and decorators from the synapse library.

```javascript
import { Resource, fields, decorators } from '@synapsejs/synapse';

const { Id, Word, Email, Text } = fields;
const { field, schema, expose } = decorators;
```

2. Ensure that the User class extends the Resource base class, and that it is the default export of the module.

```javascript
export default class User extends Resource {
  ...
```

3. For each property of the class, use the `@field` decorator to add that property to the class's schema, passing in an instance of Field defining the property's data type.

```javascript
export default class User extends Resource {
  @field(new Id()) _id;
  @field(new Word(3, 16)) username;
  @field(new Email(true)) email;
  @field(new Text(), PRV) password;
  ...
```

4. For each method that should be accessible via the API:

  - First, use the `@schema` decorator to define the schema that will validate requests to that method, passing in either an instance of Schema or an object whose values are instance of Field, which will be used to construct a Schema. In the example below, schemas are created for each method by transforming the overall schema already defined for the User class in general. To learn more, see [Schema Manipulation](#schema-manipulation).
  - Then, use the `@expose` decorator to define the HTTP method and path at which the method will be available.
  - Finally, ensure that all of the method paramaters are wrapped in braces. The methods will always be invoked with a single argument -- an object containing the key-value pairs validated by the Schema.

```javascript
  @expose('GET /:_id')
  @schema(User.schema.select('_id'))
  static async find({ _id }) {
    const document = await collection.findById({ _id });
    ...
  }

  @expose('POST /')
  @schema(User.schema.exclude('_id', 'password').extend({ password: new Hash(6) }))
  static async register({ username, email, password }) {
    const document = await collection.create({ username, email, password });
    ...
  }
```

5. Lastly, complete the business logic of each method to return either an instance of the User class or an error.

  - Use the static `create` factory method on the derived class when creating an instance from new data. This ensure that the HTTP response code will be correct.
  - Use the static `restore` factory method on the derived class when creating an instance from pre-exisiting data.
  - Use [one of many](#) static factory methods on the State class to respond with an error.

```javascript
  @expose('GET /:_id')
  @schema(User.schema.select('_id'))
  static async find({ _id }) {
    const document = await collection.findById({ _id });
    if (!document) {
      return State.NOT_FOUND();
    }
    return User.restore(document.toObject());
  }

  @expose('POST /')
  @schema(User.schema.exclude('_id', 'password').extend({ password: new Hash(6) }))
  static async register({ username, email, password }) {
    const document = await collection.create({ username, email, password });
    return User.create(document.toObject());
  }
```

6. The completed module should look something like this:

```javascript
import { Resource, fields, decorators } from '@synapsejs/synapse';

const { Id, Word, Email, Text } = fields;
const { field, schema, expose } = decorators;

export default class User extends Resource {
  @field(new Id()) _id;
  @field(new Word(3, 16)) username;
  @field(new Email(true)) email;
  @field(new Text(), PRV) password;

  @expose('GET /:_id')
  @schema(User.schema.select('_id'))
  static async find({ _id }) {
    const document = await collection.findById({ _id });
    if (!document) {
      return State.NOT_FOUND();
    }
    return User.restore(document.toObject());
  }

  @expose('POST /')
  @schema(User.schema.exclude('_id', 'password').extend({ password: new Hash(6) }))
  static async register({ username, email, password }) {
    const document = await collection.create({ username, email, password });
    return User.create(document.toObject());
  }
}
```

#### Server Setup

1. Within the server file, require synapse and invoke it, passing in the directory containing your resource definitions.

```javascript
const path = require('path');
const synapse = require('@synapsejs/synapse');

const api = synapse(path.resolve(__dirname, './resources'));
```

2. This creates an instance of the synapse server. Add a global middleware function to the instance that will handle sending all responses to the client.
  - The result of every API request is an instance of State and will be assigned to ```res.locals```.
  - Properties of the State defining metadata associated with the request/response are prefixed with a ```$```. For example, ```$status``` contains the HTTP status code.
  - Use the ```render``` method to convert the instance of State to a plain object containing a public representation of that instance.

```javascript
api.use((req, res) => {
  const state = res.locals;
  res.status(state.$status).json(state.render());
});
```

3. Route incoming HTTP API requests to the `http` handler on the synapse instance.

```javascript
app.use('/api', api.http);
```

4. Your application is now prepared to handle HTTP requests for the resources you defined.

```javascript
const path = require('path');
const express = require('express');
const synapse = require('@synapsejs/synapse');

const app = express();
const api = synapse(path.resolve(__dirname, './resources'));

app.use('/api', api.http);

api.use((req, res) => {
  const state = res.locals;
  res.status(state.$status).json(state.render());
});
```

5. To enable subscriptions to state updates via SSE, simply add the `sse` handler _before_ the `http` handler.

```javascript
app.use('/api', api.sse, api.http);
```

6. To enable WebSocket connections, route incoming websocket requests to the `ws` endpoint. This can be done using the npm package `express-ws`.

```javascript
const enableWs = require('express-ws');
enableWs(app);
app.ws('/api', api.ws);
```

7. Your completed server file should look something like this:

```javascript
const path = require('path');
const express = require('express');
const synapse = require('@synapsejs/synapse');
const enableWs = require('express-ws');

const app = express();
const api = synapse(path.resolve(__dirname, './resources'));

enableWs(app);
app.ws('/api', api.ws);
app.use('/api', api.sse, api.http);

api.use((req, res) => {
  const state = res.locals;
  res.status(state.$status).json(state.render());
});

app.listen(3000, () => console.log(`listening on port 3000...`));
```

## Intermediate Topics

#### Schema Manipulation

Coming soon.

#### Authorization

Coming soon.

#### Resource Dependencies

Coming soon.

#### Clustering

Coming soon.

## Advanced Topics

#### Data Model

Coming soon.

#### Control Flow

Coming soon.

## Authors

Madison Brown - [Github](https://github.com/madisonbrown)  
Mark Lee - [Github](https://github.com/markcmlee)  
Denys Dekhtiarenko - [Github](https://github.com/denskarlet)  
Hang Xu - [Github](https://github.com/nplaner)
