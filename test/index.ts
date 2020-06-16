/* eslint-disable import/no-extraneous-dependencies */

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const enableWs = require("express-ws");
const cors = require("cors");

const { synapse } = require("../lib/index");
const { identifier } = require("./resources/Session");

const PORT = process.argv[2] || 3000;
const PEERS = process.argv.slice(3).map((port) => `ws://[::1]:${port}/api`);

const app = express();
enableWs(app);

// standard parsers
app.use(express.json(), express.urlencoded({ extended: true }), cookieParser()); // , cors()

// ensure that all clients have a client_id cookie
app.use("/", identifier);

// initialize an instance of the synapse API with the directory containing the Resource definitions
const api = synapse(path.resolve(__dirname, "./resources")); // ["::1"], PEERS
// define global middleware for all api requests
api.use((req, res) => {
  const state = res.locals;
  res.status(state.$status()).json(state.render());
});
// route requests to api routers by protocol
app.ws("/api", api.ws);
app.use("/api", api.sse, api.http);

// serve static content
app.use(express.static(path.resolve(__dirname, "./public")));

// catch-all error handlers
app.use((req, res) => res.status(400).send("Not Found"));
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send(err.toString());
});

// if not in test mode, start the server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`listening on port ${PORT}`));
}

module.exports = app;
