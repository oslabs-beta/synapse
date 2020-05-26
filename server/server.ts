<<<<<<< HEAD
const express = require('express');
=======
const path = require("path");
const express = require("express");
const synapse = require("./synapse/synapse");
>>>>>>> 38e5ac8b8b958d6fa382e58978daa755a69d505a

const app = express();

const PORT = 3000;

app.use("/api", synapse(path.resolve(__dirname, "./resources")));

app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
