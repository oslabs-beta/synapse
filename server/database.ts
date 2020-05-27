export {};

const mongoose = require("mongoose");
const { MONGO_URI } = require("./secrets");

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "synapse",
  })
  .then(() => console.log("Connected to Mongo DB."))
  .catch((err) => console.log(err));

module.exports = (model) => {
  return mongoose.model(model, new mongoose.Schema({}, { strict: false }));
};
