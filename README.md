# synapse

Real-Time API Library

- [GitHub](https://github.com/oslabs-beta/synapse)

- [API Documentation](https://synapsejs.org/docs/globals.html)

## Table of Contents

- [Overview](#overview)

- [Getting Started](#getting-started)

  - [Defining Resources](#defining-resources)

  - [Server Setup](#server-setup)

  - [Streaming Connections](#streaming-connections)

- [Intermediate Topics](#intermediate-topics)

  - [Defining Resources in JavaScript](#defining-resources-in-javascript)

  - [Schema Transformation](#schema-transformation)

  - [Custom Field Types](#custom-field-types)

  - [Authorization and Security](#authorization-and-security)

  - [Resource Dependencies](#resource-dependencies)

  - [Clustering](#clustering)

- [Advanced Topics](#advanced-topics)

  - [Data Model](#data-model)

  - [Control Flow](#control-flow)

- [Authors](#authors)

## Overview

Building scalable and secure APIs is an immense challenge in-and-of-itself, and adding real-time functionality to an existing API only increases the complexity, often necessitating significant refactoring. Synapse attempts to solve this problem by defining a high-level, protocol-agnostic abstraction of a REST API, allowing resources to be defined once and served over multiple protocols—including HTTP, WebSockets, and SSE—while managing input validation and normalization as well as response caching under-the-hood. The library integrates seamlessly with Express, and can be used as much or as little as needed to add real-time functionality to an existing application, or to build an entire API from scratch.

Synapse applications are composed of [Resources](https://synapsejs.org/docs/classes/index.resource.html)—classes that model resources as defined by the RESTful architectural style. In this sense, resources represent collections of data that are exposed by the API (e.g. ```User```, ```Message```, ```Session```). Each resource defines a [Schema](https://synapsejs.org/docs/classes/index.schema.html) composed of [Fields](https://synapsejs.org/docs/classes/index.field.html), where fields are data types with specific requirements that can be validated (e.g. ```EmailAddress```, ```Password```, ```Number```) and schemas are collections of fields representing a set of parameters by name (e.g. ```{ email: EmailAddress, password: Password, age: Number }```). A resource’s schema, then, defines the data necessary to construct an instance of that type.

Classes that extend Resource can also define static methods and expose them to the API. In TypeScript, this is accomplished using various decorators to attach information to the method, like its HTTP endpoint. For example, a class ```User``` might expose an endpoint method called ```register``` to ```POST /user```. Each endpoint method also defines a schema, which determines exactly what data will be passed from an HTTP request to the method, and also ensures that all arguments are validated before the method is invoked. 

Under the hood, Synapse uses these resource definitions to serve data produced by endpoint methods to clients in a protocol-independent manner, simplifying the process of adding real-time support to an application. By maintaining an in-memory cache of all requested data, it can also manage subscriptions to any cacheable request and automatically push updates to clients whenever the cached state changes.

## Getting started

This guide will assume that you have already set up an Express project. To learn more about Express, [click here](https://expressjs.com/).

1. To begin, install the [npm package](https://www.npmjs.com/package/@synapsejs/synapse) by running the following command from your project directory:

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

In order to allow this resource to be served by the Synapse API, we will have to make a few changes to the class definition.

1. Begin by importing the Resource base class and necessary Fields and decorators from the Synapse library.

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
  @field(new Id(24, 24)) _id;
  @field(new Word(3, 16)) username;
  @field(new Email()) email;
  @field(new Text()) password;
  ...
```

Field classes define broad categories of data types, while their instances represent validators for specific cases of that data type. The properties necessary to define a specific case are passed in to the constructor. For example, in the above code snippet:

- The Id instance accepts only ids exactly 24 characters long.
- The Word instance accepts only alphanumeric characters between 3 and 16 characters long with no spaces.

4. For each method that should be accessible via the API:

  - First, use the `@schema` decorator to define the schema that will validate requests to that method, passing in either a) an instance of Schema, or b) an object whose values are instances of Field, which will be used to construct a Schema, or c) a callback function which evaluates to either a) or b). When a callback function is provided, the function will not be executed until a request is made to that endpoint. This feature can be levereged to prevent dependency cycles when your application is initializing. In the example below, schemas are created for each method by transforming the overall schema already defined for the User class in general. See [Schema Transformation](#schema-transformation) for more details.
  - Then, use the `@endpoint` decorator to define the HTTP verb and the path at which the method will be available. For methods used internally but not exposed to the client-facing API, use the ```READ``` or ```WRITE``` method in place of the HTTP method. See [Control Flow](#control-flow) for more details.
  - Finally, ensure that all of the method paramaters are wrapped in braces. The methods will always be invoked with a single argument—an object containing the key-value pairs validated by the Schema.

```javascript
  @endpoint('GET /:_id')
  @schema(User.schema.select('_id'))
  static async find({ _id }) {
    const document = await collection.findById({ _id });
    ...
  }

  @endpoint('POST /')
  @schema(User.schema.exclude('_id', 'password').extend({ password: new Hash(6) }))
  static async register({ username, email, password }) {
    const document = await collection.create({ username, email, password });
    ...
  }
```

5. Lastly, complete the business logic of each method. Endpoint methods must always return an instance of [State](https://synapsejs.org/docs/classes/index.state.html)—a base class encompassing Resources, [Collections](https://synapsejs.org/docs/classes/index.collection.html), errors and any other custom response types you may decide to implement. For the purpose of this example, we will return either an instance of the User class or an error.

  - Use the static ```create``` factory method on the derived class when creating a Resource instance from new data. This ensures that the HTTP response status is correctly set to ```201 CREATED```.
  - Use the static ```restore``` factory method on the derived class when creating a Resource instance from pre-exisiting data.
  - Use the static ```collection``` factory method on the derived class to create a Collection of resources of the derived type.
  - Use [one of many](https://synapsejs.org/docs/classes/index.state.html#accepted) static factory methods on the State class to respond with an error or other generic HTTP response.

```javascript
  @endpoint('GET /:_id')
  @schema(User.schema.select('_id'))
  static async find({ _id }) {
    const document = await collection.findById({ _id });
    if (!document) {
      return State.NOT_FOUND();
    }
    return User.restore(document.toObject());
  }

  @endpoint('POST /')
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
  @field(new Id(24, 24)) _id;
  @field(new Word(3, 16)) username;
  @field(new Email()) email;
  @field(new Text()) password;

  @endpoint('GET /:_id')
  @schema(User.schema.select('_id'))
  static async find({ _id }) {
    const document = await collection.findById({ _id });
    if (!document) {
      return State.NOT_FOUND();
    }
    return User.restore(document.toObject());
  }

  @endpoint('POST /')
  @schema(User.schema.exclude('_id', 'password').extend({ password: new Hash(6) }))
  static async register({ username, email, password }) {
    const document = await collection.create({ username, email, password });
    return User.create(document.toObject());
  }
}
```

#### Server Setup

1. Within the server file, require Synapse and invoke it, passing in the directory containing your resource definitions.

```javascript
const path = require('path');
const synapse = require('@synapsejs/synapse');

const api = synapse(path.resolve(__dirname, './resources'));
```

2. This creates an instance of the Synapse server. Add a global middleware function to the instance that will handle sending all responses to the client.

  - The result of every API request is an instance of State and will be assigned to ```res.locals```.
  - If the request was made to one of the streaming interfaces, it's ```res``` argument will be different than the standard object passed by Express for HTTP requests. You can determine the type of request that was made by checking for the existence of a ```stream``` method on the ```res``` object. See [Streaming Connections](#streaming-connections) for more details.
  - Properties of the State instance defining metadata associated with the request/response are prefixed with a ```$```. For example, ```$status``` contains the HTTP status code.
  - Use the ```serialize``` method to convert the instance of State to a public, serial representation of that instance ready for network transport.

```javascript
api.use((req, res) => {
  const state = res.locals;
  if (res.stream) {
    return res.stream(state);
  }
  return res.status(state.$status).send(state.serialize());
});
```

3. Route incoming HTTP API requests to the `http` handler on the Synapse instance.

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

6. To enable WebSocket connections, route incoming WebSocket requests to the `ws` handler. This can be accomplished using the [express-ws](https://www.npmjs.com/package/express-ws).

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

#### Streaming Connections

As already mentioned, Synapse provides two interfaces for streaming protocols in addition to the standard HTTP interface. The primary purpose of these real-time interfaces is to allow _subscriptions_ to resources—that is, the ability to obtain state updates continuously whenever a given resource changes. However, the websocket interface in particular can also be used to process standard requests at a reduced latency.

##### Server-Sent Events (SSE)
The SSE interface is used only for subscriptions and works on a one-per-connection basis. The SSE interface will not accept requests for write operations, as they can't be subscribed to.

- To create a subscription, simply add the ```Content-Type: text/event-stream``` header to an otherwise normal HTTP ```GET``` request for a given Resource, and you will receive its initial state, as well as its new state whenever a change occurs. 
- To cancel a subscription, simply close the associated connection.
- To subscribe to multiple resources, either create multiple SSE connections, or use WebSockets.

##### WebSockets (WS)
The WS interface can process any request that the standard HTTP interface can, in addition to subscription requests.

- To connect from your client application, create a WebSocket connection to the path exposed by the Express server. For example:

```javascript
const api = new WebSocket('ws://[hostname]/api');
...
```

- The WS interface accepts requests in the form of a JSON object whose keys are endpoints strings (```METHOD /path```) and whose values are other objects containing the arguments to be included with the request. For example:

```json
{
  "POST /user": {
    "username": "john",
    "password": "secret"
  }
}
```

- The response to each request will also be a JSON object, and the key on that object will exactly match the key on the request object.
- The WebSocket interface accepts two custom methods ```SUBSCRIBE``` and ```UNSUBSCRIBE```. The subscribe method is intitially identical to a ```GET``` request. A request to ```SUBSCRIBE /message```, then, would first return the result of the request:

```json
{
  "SUBSCRIBE /message/123": {
    "status": 200,
    "query": "/message/123?",
    "payload": {
      "text": "hello world!"
    },
    ...
  }
}
```

- Notice that the reponse to the initial request contains a metadata property called ```query```. This is the normalized request path and argument set that uniquely represents, and will be used to identify, the subscription. 
- In our example, whenever the state of ```/message/123``` would change, the client would receive a message object with a key equal to the query string and whose associated value was the state of the resource at that path, with no metadata attached (e.g. status code):

```json
{
  "/message/123?": {
    "text": "hello again!"
  }
}
```

- The query string is also used to cancel a subscription, using the ```UNSUBSCRIBE``` method:

```json
{
  "UNSUBSCRIBE /message/123?": {}
}
```

## Intermediate Topics

#### Defining Resources in JavaScript

Although JavaScript does not currently support decorators, it's still possible to write Synapse applications without using TypeScript. Decorators in Synapse are a form of "syntactic sugar" used to a) add fields to the static instance of Schema on a Resource-derived class, and b) to convert its endpoint methods to instances of [Controller](https://synapsejs.org/docs/classes/control.controller.html)—a special type of callable object. We can achieve the same functionality by a) defining the static ```schema``` property manually, and b) using the static ```controller``` method on the Resource base class to create instances of Controller. 

The ```controller``` method accepts two arguments:

1. An object containing any of the following keys: ```endpoint```, ```authorizer```, ```schema```, ```instance```, ```uses```, ```affects``` (Note that these correspond to the available decorator functions). 
2. A function to be exposed by the API.

In this way, our example ```User``` class can be rewritten to the following equivalent version in JavaScript:

```javascript
const { Resource, fields, decorators } = require('@synapsejs/synapse');

const { Id, Word, Email, Text } = fields;
const { field, schema, expose } = decorators;

class User extends Resource {
  static schema = new Schema({
    _id: new Id(24, 24),
    username: new Username(3, 16),
    email: new Email(),
    password: new Text()
  });

  static find = User.controller(
    {
      endpoint: 'GET /:_id',
      schema: User.schema.select('_id')
    },
    async find({ _id }) {
      const document = await collection.findById({ _id });
      if (!document) {
        return State.NOT_FOUND();
      }
      return User.restore(document.toObject());
    }
  );

  static register = User.controller(
    {
      endpoint: 'POST /',
      schema: User.schema.exclude('_id', 'password').extend({ password: new Hash(6) })
    },
    async register({ username, email, password }) {
      const document = await collection.create({ username, email, password });
      return User.create(document.toObject());
    }
  );
}
```

#### Schema Transformation

In Synapse, _schema transformation_ refers to the process of using existing schemas to define new ones, and it can help to keep our code more concise. We've already seen two examples of schema transformation in our hypothetical ```User``` class:

```javascript
User.schema.select('_id')
```

and:

```javascript
User.schema.exclude('_id', 'password').extend({ password: new Hash(6) })
```

- In each case, we begin by accessing the static ```schema``` property on the User class, which is an instance of Schema. Remember that the User schema was created by applying the ```@field``` decorator to the class's properties.
- In the first example, we use the ```select``` method of the Schema class to create and return a new schema containing only the fields from the User schema whose names are passed in as arguments—in this case, just the ```_id``` field.
- In the second example, we first use the ```exclude``` method to create a new schema containing all of the fields from the User schema _except_ the fields whose names are passed in as arguments—in this case, the ```_id``` and ```password``` fields. Finally, we transform the resulting schema using the ```extend``` method on the Schema class to create a new schema containing all of the fields of the called instance, plus those passed in on the argument object.

There are three other ways to transform schemas:

1. The ```default``` method on the Schema class creates a copy of the called instance, but applies default values to the fields as specified by the passed in argument object.
1. The ```flags``` method on the Schema class creates a copy of the called instance, but overrides the existing flags as specified by the passed in argument object. See the [Field](https://synapsejs.org/docs/classes/index.field.html#flags-1) API documentation for more details.
2. The static ```union``` method on the Resource class creates a new schema by combining the fields of multiple Resource schema's.

See the [Schema](https://synapsejs.org/docs/classes/index.schema.html) API documentation for more details.

#### Custom Field Types

One of the most powerful features of Synapse is the ability to define custom Field types by extending existing ones. In our hypothetical User class, we used an instance of the ```Id``` Field type with a min and max length of 24 characters to define a property on the User class that would accept id strings generated by MongoDB. Indeed, MongoDB ids are 24 characters long, but they also have another well-defined property that we can enforce: they can contain only the the letters a-f and digits 0-9.

1. Start by importing the default fields from the Synapse library and destructuring the ```Id``` class from the object. Then, define a new class called ```MongoId``` which extends ```Id```.

```javascript
import { fields } from '@synapsejs/synapse';

const { Id } = fields;

export default class MongoId extends Id {

}
```

2. In the constructor, after invoking ```super```, use the ```assert``` method from the ```Text``` prototype to add a new regular expression rule to the instance. The ```assert``` method accepts 3 arguments: 1) an instance of ```RegExp``` (or a string which can be used to construct one), 2) a boolean representing the expected result of testing a valid input against the the regular expression, and 3) a human-readable explanation of the rule which will be used in error messages.

```javascript
import { fields } from '@synapsejs/synapse';

const { Id } = fields;

export default class MongoId extends Id {
  constructor(flags = null) {
    super();

    this.assert(
      /^[0-9a-f]{24}$/i,
      true,
      'must be a string of 24 hex characters'
    );
  }
}
```

3. We can now change the ```_id``` field on the User schema to use this more-explicit type:

```javascript
import MongoId from '../fields/MongoId';
...
@field(new MongoId()) _id;
```

- Because our method schemas were defined by transforming the overall User schema, we don't need to change their definitions.

Whenever possible, Field rules should be defined in this way, using regular expressions, because these rules can be easily exposed to a client for use in client-side validation. However, not all rules can be represented as a regular expression. In such cases, it will be neccessary to override the ```parse``` method from the ```Field``` prototype in order to define more complex validation behavior. See the [Field](https://synapsejs.org/docs/classes/index.field.html#parse) API documentation for more details. 

#### Authorization and Security

##### Private Fields

You may have noticed a security flaw our User example—when instances of User are returned from the API, all of their properties are revealed to the client, including the hashed password. There are two ways to change the public representation of a resource. In most cases, we can use a _flag_ to prevent certain fields from being exposed to the client.

1. In the User module, import the ```Field``` class from the Synapse Libary and destructure the ```PRV``` flag from the ```Field.Flags``` enum object.

```javascript
import { Resource, Field, fields, decorators } from '@synapsejs/synapse';

const { Id, Word, Email, Text } = fields;
const { field, schema, expose } = decorators;
const { PRV } = Field.Flags;
```

2. Add the ```PRV``` flag to the password field. This can be done in two ways:

  - As the fourth argument to the ```Text``` constructor

  ```javascript
  @field(new Text(null, null, undefined, PRV)) password;
  ```

  - Or, as the second argument to the ```@field``` decorator method

  ```javascript
  @field(new Text(), PRV) password;
  ```

In some cases, if more complex behavior is required, it will be necessary to override the ```render``` method from the Resource prototype. See the [Resource](https://synapsejs.org/docs/classes/index.resource.html#render) API documentation for more details.

##### Middleware

In most cases, we will also want to add some type of authorization layer to our APIs. This can be accomplished using middlware functions. Consider the following hypothetical Session class. For the purpose of this example, sessions will contain just two properties: a client id and a user id, and will be stored in memory. It will also expose two endpoints: ```POST /session``` creates a session from a username, password, and client id, while ```GET /session/me``` returns information about the currently authenticated user, given a client id.

_NOTE: While middleware functions in Express are used to improve code reusability and modularization, that is not their purpose in Synapse. Synapse relies on an object-oriented approach to code reuse, as shown in the below example, where the Session class reuses functionality of the User class by invoking one of its methods._

```javascript
import { Resource, State, fields, decorators } from '@synapsejs/synapse';
import User from './User';

const { Id } = fields;
const { field, expose, schema } = decorators;

const sessions = {};

export default class Session extends Resource {
  @field(new Id(36)) client_id: string;
  @field(new Id(36)) user_id: string;

  @endpoint('POST /')
  @schema(Session.union(User).select('username', 'password', 'client_id'))
  static async open({ username, password, client_id }) {
    const result = await User.authenticate({ username, password });

    if (result instanceof User) {
      sessions[client_id] = result;
    }

    return result;
  }

  @endpoint('GET /me')
  @schema(Session.schema.select('client_id'))
  static async read({ client_id }) {
    return sessions[client_id];
  }
}
```

But where will the ```client_id``` come from? In this example, we will assign the ```client_id``` using cookies, but the endpoint method doesn't have to _know_ this. Since Synapse provides a protocol-agnostic abstraction of a REST API, there is no concept of query paramaters, request bodies, or cookies within the Resource domain—all request arguments are combined into a single object and passed to the endpoint's schema for validation. Thus, the above schemas simply look for a ```client_id``` property _anywhere_ on the incoming request, and then check that it meets the requirements specified by the associated field.

1. You might use an Express middleware function like the following to assign a unique id to all new clients, before they have been authenticated:

```javascript
import { v4 as uuidv4 } from 'uuid';

export const identify = (req, res, next) => {
  if (!req.cookies.client_id) {
    res.cookie('client_id', req.cookies.client_id = uuidv4());
  }
  next();
};
```

2. Now, in our Session module, lets define a Synapse middleware function which will authorize incoming requests by a) ensuring that the ```client_id``` property is present on the request, and b) that the ```client_id``` is associated with a valid session.

```javascript
export const authorize = (args) => {
  const { client_id } = args;

  const client = sessions[client_id];

  if (!client) {
    return State.UNAUTHORIZED();
  }

  return [args];
};
```

  - Note that Synapse middleware functions are different from Express middleware functions; Synapse middleware functions accept a single argument—an amalgamation of all request arguments including the request body, query params, path params, and cookies. Synapse middlware functions should return an array containing the argument object for the next middleware function in the chain, _or_ an instance of ```State``` to abort the operation. 

3. Finally, lets secure the ```GET /session/me``` endpoint by passing the ```authorize``` Synapse middleware function to the ```@authorizer``` decorator. (The ```@authorizer``` decorator can also accept a variable number arguments, all middleware functions to be executed in order).

```javascript
@endpoint('GET /me')
@authorizer(authorize)
@schema(Session.schema.select('client_id'))
static async read({ client_id }) {
  return sessions[client_id];
}
```

The completed Session module should look something like this:

```javascript
import { Resource, State, fields, decorators } from '@synapsejs/synapse';
import User from './User';

const { Id } = fields;
const { field, expose, schema } = decorators;

const sessions = {};

export const identify = (req, res, next) => {
  res.cookie('client_id', req.cookies.client_id || uuidv4());
  next();
};

export const authorize = (args) => {
  const { client_id } = args;

  const client = sessions[client_id];

  if (!client) {
    return State.UNAUTHORIZED();
  }

  return [args];
};

export default class Session extends Resource {
  @field(new Id(36)) client_id: string;
  @field(new Id(36)) user_id: string;

  @endpoint('POST /')
  @schema(Session.union(User).select('username', 'password', 'client_id'))
  static async open({ username, password, client_id }) {
    const result = await User.authenticate({ username, password });

    if (result instanceof User) {
      sessions[client_id] = result;
    }

    return result;
  }

  @endpoint('GET /me')
  @authorizer(authorize)
  @schema(Session.schema.select('client_id'))
  static async read({ client_id }) {
    return sessions[client_id];
  }
}
```

#### Resource Dependencies

Whenever a read (i.e. ```GET```) request is made to a _path_ within a Synapse API, the resulting State will have certain _dependencies_—that is, other paths to which a write request will cause said State to be invalidated. All non-error States have at least one dependency, which is the same path from which the State was read. This is demonstrated by the following example: 

  1. Client A ```GET```s the value of ```/message``` and receives a collection of Message resources [ ```/message/0```, ```/message/1```, ```/message/2``` ].
  2. Client B ```POST```s to ```/message```, creating new message.
  3. The number of messages in the collection has changed, so client A's copy of the the state is no longer valid.

In the case of a collection, the paths of each Resource contained within that collection are also dependencies of its state. That is:

  4. If Client B were to ```PATCH /message/0```, that request would also invalidate the state of ```/message``` held by client A.

This default behavior is inherent to RESTful systems and cannot be changed within Synapse; however, it can be extended. Lets consider a complete example of a ```Message``` resource. In this example, the messages will be stored in memory and we will intend for them to be subscribed to in a real-time application.

```javascript
import { Resource, State, fields, decorators } from '@synapsejs/synapse';

const { Id, Text, Integer } = fields;
const { field, expose, schema, affects, uses } = decorators;

const pageSize = 10;
const ledger = [];

export default class Message extends Resource {
  @field(new Id()) id: string;
  @field(new Text()) text: string;

  @endpoint('GET /')
  static get() {
    const start = ledger.length - pageSize * index;
    return Message.collection([...ledger].reverse());
  }

  @endpoint('POST /')
  @schema(Message.schema.select('text'))
  static async post({ text }) {
    const comment = await Message.create({ id: `${ledger.length}`, text });
    ledger.push(comment.export());
    return comment;
  }
}
```

This bare-bones example _could_ be used to create a chat application. A subscription request to ```/message``` would return all of the messages in memory, and whenever a new message was posted, the client would receive the entire new state of the collection. Obviously, this wouldn't be very efficient. Let's improve the design by adding an endpoint which returns only the last message in memory:

```javascript
import { Resource, State, fields, decorators } from '@synapsejs/synapse';

const { Id, Text, Integer } = fields;
const { field, expose, schema, affects, uses } = decorators;

const ledger = [];

export default class Message extends Resource {
  @field(new Id()) id: string;
  @field(new Text()) text: string;

  @endpoint('GET /last')
  static last() {
    if (!ledger[ledger.length - 1]) {
      return State.NOT_FOUND();
    }
    return Message.restore(ledger[ledger.length - 1]);
  }

  @endpoint('GET /')
  static get() {
    return Message.collection([...ledger].reverse());
  }

  @endpoint('POST /')
  @schema(Message.schema.select('text'))
  static async post({ text }) {
    const comment = await Message.create({ id: `${ledger.length}`, text });
    ledger.push(comment.export());
    return comment;
  }
}
```

Now, our clients can initially request the entire message collection, but then subscribe to only the last message in the collection. However, as currently written, they will not receive live updates to that state, because Synapse can't automatically deduce the dependency between the state returned from ```/message/last``` and the overall ```/message``` path. We will have to declare this dependency using either the ```@uses``` decorator on the read endpoint:

```javascript
@endpoint('GET /last')
@uses('/')
static last() {
  ...
}
```

_or_ the ```@affects```decorator on the write endpoint:

```javascript
@endpoint('POST /')
@schema(Message.schema.select('text'))
@affects('/last')
static async post({ text }) {
  ...
}
```

These are functionally equivalent in this case, but note that the paths passed to ```@uses``` and ```@affects``` can reference arguments validated by the schema (e.g. ```@uses('/:id)```), which may affect your decision to use one or the other in a given scenario.

#### Clustering

Synapse supports clustering natively. To synchronize state between multiple instances of a Synapse API, you will need to add two arguments to the invocation of ```synapse``` in your Express server file;

```javascript
const resources = path.resolve(__dirname, './resources');
const accept = [
  /* an array containing the IP addresses of all peer servers */
];
const join = [
  /*an array containing the WebSocket connection URIs of all peer servers*/
];

const api = synapse(resources, accept, join);
```

Now, the instance of the Synapse API will attempt to connect to all peers using the WebSocket URIs in ```join``` and will accept peer connections from any IP address in ```accept```. Note that it is also acceptable to invoke Synapse with Promises that resolve to these arrays if the peer servers have to be discovered dynamically. 

## Advanced Topics

#### Data Model

Coming soon.

#### Control Flow

Coming soon.

## Authors

- [Madison Brown](https://github.com/madisonbrown)
- [Denys Dekhtiarenko](https://github.com/denskarlet)  
- [Mark Lee](https://github.com/markcmlee)
- [Hang Xu](https://github.com/nplaner)
