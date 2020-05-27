export {};
const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const synapse = require("./synapse/synapse");

const app = express();

const PORT = 3000;
const mongoURI =
  "mongodb+srv://denskarlet:DS090295170837@cluster0-cwr1z.mongodb.net/test?retryWrites=true&w=majority";

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "synapse",
  })
  .then(() => console.log("Connected to Mongo DB."))
  .catch((err) => console.log(err));

app.use(express.json());

app.use("/api", synapse(path.resolve(__dirname, "./resources")));

app.get("/", (req, res) => {
  res.send("hello world");
});

app.use((err, req, res, next) => res.status(err.status).send(err.serialize()));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

module.exports = app;
