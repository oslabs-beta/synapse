/* eslint-disable import/no-cycle */
/* eslint-disable import/extensions */

import State from '../State';
import Relation from '../utility/Relation';
import { Cache } from '../control/Manager';

/** An extension of the abstract {@linkcode Cache} interface which implements all required functionality locally (i.e. within the process's memory). */
export default class LocalCache extends Cache {
  /** Maps _queries_ to the {@linkcode State|states} produced by invoking their associated {@linkcode Manager.operations|operations}. */
  private states: Map<string, State> = new Map();

  /** Maps _paths_ to _queries_. Whenever a _path_ is {@linkcode Manager.invalidate|invalidated}, its associated _queries_ will be {@linkcode Manager.cache|recalculated}. */
  private dependents: Relation<string, string> = new Relation();

  setState(state: State): boolean {
    const query = state.$query;

    this.states.set(query, state);

    this.dependents.unlink(null, query);
    state.$dependencies.forEach((path: string) => {
      this.dependents.link(path, query);
    });

    return true;
  }

  unset(query: string): boolean {
    this.states.delete(query);
    this.dependents.unlink(null, query);

    return true;
  }

  getState(query: string): State {
    return this.states.get(query);
  }

  getQueries(path: string): Array<string> {
    return Array.from(this.dependents.from(path));
  }
}
