/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import { Resource, Reply } from "../../lib";
import { field, endpoint, validator, affect } from "../../lib/Resource";
import { Id, Text, Integer } from "../../lib/fields";

const pageSize = 10;
const ledger = [];

export default class Comment extends Resource {
  @field(new Id()) id: string;
  @field(new Text()) text: string;

  @endpoint("GET /last")
  static Last() {
    return ledger[ledger.length - 1] || Reply.NOT_FOUND();
  }

  @endpoint("GET /:id")
  @validator(Comment.schema.select("id"))
  static Find({ id }) {
    return ledger[id] || Reply.NOT_FOUND();
  }

  @endpoint("GET /page/:index")
  @validator({ index: new Integer() })
  static List({ index }) {
    const start = ledger.length - pageSize * index;
    const result = ledger.slice(start, start + pageSize).reverse();
    return result;
  }

  @endpoint("POST /")
  @affect("/last") // "/page/*" fix: support wildcards
  @validator(Comment.schema.select("text"))
  static async Post({ text }) {
    const comment = await Comment.instantiate({ id: `${ledger.length}`, text });
    ledger.push(comment);
    return comment;
  }
}
