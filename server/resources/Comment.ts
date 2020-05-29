/* eslint-disable lines-between-class-members */

export {};

const Resource = require("../synapse/Resource");
const { Id, Text, Integer } = require("../synapse/fields");

const { field, endpoint, validator, affect } = Resource.Decorators;

const ledger = [];

class Comment extends Resource {
  @field(new Id()) id;
  @field(new Text()) text;

  @endpoint("GET /:id")
  @validator(Comment.schema.select("id"))
  static Find({ id }) {
    return ledger[id];
  }

  @endpoint("GET /page/:index")
  @validator({ index: new Integer() })
  static List({ page }) {
    const start = ledger.length - 1 - 10 * page;
    return ledger.slice(start, start + 10).reverse();
  }

  @endpoint("GET /last")
  static Last() {
    return ledger[ledger.length - 1];
  }

  @endpoint("POST /")
  @affect("/last", "/page/*")
  @validator(Comment.schema.select("text"))
  static async Post({ text }) {
    const comment = await Comment.create({ id: ledger.length, text });
    ledger.push(comment);
    console.log(ledger);
    return comment;
  }
}

module.exports = Comment;
