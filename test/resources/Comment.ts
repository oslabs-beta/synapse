/* eslint-disable import/extensions */
/* eslint-disable lines-between-class-members */

import { Resource, State } from '../../lib';
import decorators from '../../lib/abstract/@';
import { Id, Text, Integer } from '../../lib/fields';

const { field, endpoint, schema, uses } = decorators;

const pageSize = 10;
const ledger = [];

export default class Comment extends Resource {
  @field(new Id()) id: string;
  @field(new Text()) text: string;

  @endpoint('GET /last')
  @uses('/')
  static Last() {
    if (!ledger[ledger.length - 1]) {
      return State.NOT_FOUND();
    }
    return Comment.restore(ledger[ledger.length - 1]);
  }

  @endpoint('GET /:id')
  @schema(Comment.schema.select('id'))
  static Find({ id }) {
    if (!ledger[id]) {
      return State.NOT_FOUND();
    }
    return Comment.restore(ledger[id]);
  }

  @endpoint('GET /page/:index')
  @schema({ index: new Integer() })
  @uses('/')
  static List({ index }) {
    const start = ledger.length - pageSize * index;
    return Comment.collection(ledger.slice(start, start + pageSize));
  }

  @endpoint('POST /')
  @schema(Comment.schema.select('text'))
  static async Post({ text }) {
    const comment = await Comment.create({ id: `${ledger.length}`, text });
    ledger.push(comment.export());
    return comment;
  }
}
