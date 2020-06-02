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
<<<<<<< HEAD
app.ws("/api", api.ws);
=======
// ensure that all clients have a client_id cookie
app.use("/", identifier);
// add routes for each supported API access protocol
app.ws("/rapi", api.ws);
app.use("/rapi", api.sse);
>>>>>>> 79f27f0a5be9976035f1a6ce3cde638cf8bf6287
app.use("/api", api.http);
app.use("/api", api.sse);

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
