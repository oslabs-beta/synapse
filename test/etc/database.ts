/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */

import * as mongoose from "mongoose";
import { MONGO_URI } from "./secrets";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "synapse",
  useFindAndModify: false,
};

mongoose
  .connect(MONGO_URI, options)
  .then(() => console.log("Connected to Mongo DB."))
  .catch((err) => console.log(err));

const schema = new mongoose.Schema({}, { strict: false });

export default (model: string) => {
  return mongoose.model(model, schema);
};
