export {};

const path = require("path");
const express = require("express");
const enableWs = require("express-ws");
const synapse = require("./synapse/synapse");

const PORT = 3000;
const app = express();
const api = synapse(path.resolve(__dirname, "./resources"));

app.use(express.json());

enableWs(app);
app.ws("/api", api.ws);
app.use("/api", api.http);

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./src/index.html"));
});

app.use((err, req, res, next) => {
  console.log(err);
  res
    .status(err.status || 500)
    .json(err.serialize ? err.serialize() : "Internal Server Error");
});
app.listen(PORT, () => console.log(`listening on port ${PORT}`));

module.exports = app;
