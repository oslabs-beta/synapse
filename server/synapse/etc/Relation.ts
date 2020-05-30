/* eslint-disable no-underscore-dangle */

export default class Relation<F, T> {
  _from: Map<F, Set<T>> = new Map();

  _to: Map<T, Set<F>> = new Map();

  link(from: F, to: T) {
    if (!this._from.has(from)) {
      this._from.set(from, new Set());
    }
    this._from.get(from).add(to);

    if (!this._to.has(to)) {
      this._to.set(to, new Set());
    }
    this._to.get(to).add(from);
  }

  unlink(from: F = null, to: T = null) {
    if (from && to) {
      this._from.get(from).delete(to);
      this._to.get(to).delete(from);
    } else if (from) {
      if (this._from.has(from)) {
        this._from.get(from).forEach((val: T) => {
          this._to.get(val).delete(from);
        });
        this._from.delete(from);
      }
    } else if (to) {
      if (this._to.has(to)) {
        this._to.get(to).forEach((val: F) => {
          this._from.get(val).delete(to);
        });
        this._to.delete(to);
      }
    }
  }

  from(val: F): Array<T> {
    return this._from.has(val) ? Array.from(this._from.get(val)) : [];
  }

  to(val: T): Array<F> {
    return this._to.has(val) ? Array.from(this._to.get(val)) : [];
  }
}
