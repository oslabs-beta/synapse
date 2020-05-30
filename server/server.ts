export {};

const path = require("path");
const express = require("express");
const enableWs = require("express-ws");
const synapse = require("./synapse/index");

const PORT = 3000;
const app = express();
const api = synapse(path.resolve(__dirname, "./resources"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("src"));

// const countdown = (res, count) => {
//   res.write("data: " + count + "\n\n");
//   if (count) {
//     setTimeout(() => countdown(res, count - 1), 1000);
//   } else {
//     res.end();
//   }
// };

app.get("/sse", (req, res) => {
  res
    .set({
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    })
    .status(200);
  // countdown(res, 10);
});

enableWs(app);
app.ws("/api", api.ws);
app.use("/api", api.http);
app.use("/api", api.sse);

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./src/index.html"));
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send(err.toString());
});
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`listening on port ${PORT}`));
}

module.exports = app;
