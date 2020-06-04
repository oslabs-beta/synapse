const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const enableWs = require("express-ws");
const { synapse } = require("./synapse");
const { identifier } = require("./resources/Session");

const PORT = 3000;
const app = express();

// standard parsers
app.use(express.json(), express.urlencoded({ extended: true }), cookieParser());

// initialize an instance of the synapse API with the directory containing the Resource definitions
const api = synapse(path.resolve(__dirname, "./resources"));
// initialize express-ws
enableWs(app);
// ensure that all clients have a client_id cookie
app.use("/", identifier);
// add routes for each supported API access protocol
app.ws("/rapi", api.ws);
app.use("/rapi", api.sse);
app.use("/api", api.http);

// serve static content
app.use(express.static(path.resolve(__dirname, "./src")));

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
