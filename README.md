# Synapse

Realtime API Library
https://oslabs-beta.github.io/synapse/classes/field.html

#### Table of Contents

- [Installing and Running](#installing-and-running)

- [Setup for the local development environment](#setup-for-the-local-development-environment)

  - [Server Setup](#server-setup)

  - [Resource example](#resource-example)

- [Authors](#authors)

#### Installing and Running

- Installing the package [npmjs.com](https://www.npmjs.com/package/@synapsejs/synapse)

```javascript
npm i @synapsejs/synapse
```

## Setup for the local development environment

#### Server Setup

```javascript
const synapse = require("@synapsejs/synapse");

const express = require("express");
const path = require("path");
const enableWs = require("express-ws");

const app = express();
const api = synapse(path.resolve(__dirname, "./resources"));

enableWs(app);
app.ws("/api", api.ws);
app.use("/api", api.sse, api.http);

api.use((req, res) => {
  res.status(res.locals.$status()).json(res.locals.render());
});
```

- Within the server file, require synapse and invoke it passing in the directory of your resources.
- To add Websocket support to your endpoints - simply add .ws method of synapse instance to the route.
- Similar logic follows HTTP and SSE handling, with a simple rule to follow: .sse method should always come before .http method on your route.
- api.use middleware is handling all the responses.

Let's draw a simple mental model:
Any incoming request is being process by its respective method, after going through synapse it'll be sent back to the client from the global api.use response handler.

#### Resource example

```javascript
export default class User extends Resource {
  @field(new MongoId()) _id: string;
  @field(new Word(3, 16)) username: string;
  @field(new Email(true)) email: string;
  @field(new Text(), PRV) password: string;

  @expose("GET /:_id")
  @schema(User.schema.select("_id"))
  static async find({ _id }) {
    const document = await collection.findById({ _id });
    if (!document) {
      return State.NOT_FOUND();
    }
    return User.restore(document.toObject());
  }

  @expose("POST /")
  @schema(User.schema.exclude("_id", "password").extend({ password: new Hash(6) }))
  static async register({ username, email, password }) {
    const document = await collection.create({ username, email, password });
    return User.create(document.toObject());
  }
}
```

- This code snippet demonstrates a sample User class.
- Note that all classes that are passed to Synapse should extend the [Resource](https://oslabs-beta.github.io/synapse/classes/resource.html) class.
- Next, we have 4 field decorators that define [schemas](https://oslabs-beta.github.io/synapse/classes/schema.html) for each user input

  - The first field decorator guarantees that all \_id's follow the MongoId format.
  - Word and Text take 2 optional arguments that determine how short or long these inputs should be.
    - In this case, usernames must be within 3~16 characters.
  - Inputs that go through the Email field go through a RegExp that verifies that they are in the correct format.

  - It is also possible to edit these fields or even create your own to suit your needs.

- The expose decorator dynamically creates routes that are specified to the passed in endpoints.

  - Here, we have two exposed endpoints that find a user by id and create a new user, respectively.
  - Each have their own schemas.
    - The first uses select, which creates a new schema containing a subset of the instance's fields.
      - It takes the names of the fields which should be transferred to the new schemas as arguments.
    - The second uses exclude and extend, which:
      - Creates a new schema containing a subset of the instance's fields excluding those passed-in as arguments. ([exclude](https://oslabs-beta.github.io/synapse/classes/schema.html#exclude))
      - Creates a new schema containing all of the current instance's fields along with the additional fields you can pass in. ([extend](https://oslabs-beta.github.io/synapse/classes/schema.html#extend))

- The business logic of these methods is entirely up to you, but must return either an instance of the class you are in, or an instance of [State](https://oslabs-beta.github.io/synapse/classes/reply.html).
  - These classes have access to the restore and create methods, along with many others.
    - These two methods attempt to create a new instance of the the class from the plain object in compliance with the Class's schema.
  - State contains methods that correspond to response errors
  - They can be passed custom messages to return to the client.
    - [State.NOT_FOUND()](https://oslabs-beta.github.io/synapse/classes/reply.html#not_found), for example, corresponds to a 404 error and will only return this status code.
    - If it were [State.NOT_FOUND("This user does not exist")](https://oslabs-beta.github.io/synapse/classes/reply.html#not_found), this message will be passed along as well.

#### Authors

Madison Brown - [Github](https://github.com/madisonbrown)  
Mark Lee - [Github](https://github.com/markcmlee)  
Denys Dekhtiarenko - [Github](https://github.com/denskarlet)  
Hang Xu - [Github](https://github.com/nplaner)
