export {};
const path = require("path");
const express = require("express");
const enableWs = require("express-ws");
const synapse = require("./synapse/synapse");

const PORT = 3000;
const app = express();
enableWs(app);
app.ws("/", (ws, req) => {
  ws.on("message", (msg) => {
    ws.send(msg);
  });
});
app.use(express.json());
app.use("/api", synapse(path.resolve(__dirname, "./resources")));
app.get("/", (req, res) => {
  console.log("");
  // res.send("hello world");
  res.sendFile(path.resolve(__dirname, "./src/index.html"));
});

app.use((err, req, res, next) => res.status(err.status).send(err.serialize()));
app.listen(PORT, () => console.log(`listening on port ${PORT}`));
module.exports = app;
