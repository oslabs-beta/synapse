/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import { Resource, Collection, State } from "../../lib";
import { field, expose, schema, affects, uses } from "../../lib/@";
import { Id, Text, Integer } from "../../lib/fields";

const pageSize = 10;
const ledger = [];

export default class Comment extends Resource {
  @field(new Id()) id: string;
  @field(new Text()) text: string;

  @expose("GET /last")
  static Last() {
    return ledger[ledger.length - 1] || State.NOT_FOUND();
  }

  @expose("GET /:id")
  @schema(Comment.schema.select("id"))
  static Find({ id }) {
    return ledger[id] || State.NOT_FOUND();
  }

  @expose("GET /page/:index")
  @schema({ index: new Integer() })
  @uses("/")
  static List({ index }) {
    const start = ledger.length - pageSize * index;
    return new Collection(ledger.slice(start, start + pageSize).reverse());
  }

  @expose("POST /")
  @schema(Comment.schema.select("text"))
  @affects("/last")
  static async Post({ text }) {
    const comment = await Comment.create({ id: `${ledger.length}`, text });
    ledger.push(comment);
    return comment;
  }
}
