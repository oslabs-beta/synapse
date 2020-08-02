/** Data structure storing many-to-many relationships between two value types -- essentially a bidirectional map.  */
export default class Relation<F, T> {
  private fromMap: Map<F, Set<T>> = new Map();

  private toMap: Map<T, Set<F>> = new Map();

  /** Creates an association _from_ the first argument _to_ the second. */
  link(from: F, to: T) {
    if (!this.fromMap.has(from)) {
      this.fromMap.set(from, new Set());
    }
    this.fromMap.get(from).add(to);

    if (!this.toMap.has(to)) {
      this.toMap.set(to, new Set());
    }
    this.toMap.get(to).add(from);
  }

  /** Removes the association between two values if one exists. If either argument is ```null```, removes all associations _from_ or _to_ the other argument. */
  unlink(from: F = null, to: T = null) {
    if (from && to) {
      if (this.fromMap.has(from)) {
        this.fromMap.get(from).delete(to);
      }
      if (this.toMap.has(to)) {
        this.toMap.get(to).delete(from);
      }
    } else if (from) {
      if (this.fromMap.has(from)) {
        this.fromMap.get(from).forEach((val: T) => {
          this.toMap.get(val).delete(from);
        });
        this.fromMap.delete(from);
      }
    } else if (to) {
      if (this.toMap.has(to)) {
        this.toMap.get(to).forEach((val: F) => {
          this.fromMap.get(val).delete(to);
        });
        this.toMap.delete(to);
      }
    }
  }

  /** Returns all associations _from_ the given value _to_ any other value.  */
  from(val: F = null): IterableIterator<T> {
    if (val === null) {
      return this.toMap.keys();
    }
    return this.fromMap.has(val) ? this.fromMap.get(val).values() : [].values();
  }

  /** Returns all associations _to_ the given value _from_ any other value.  */
  to(val: T = null): IterableIterator<F> {
    if (val === null) {
      return this.fromMap.keys();
    }
    return this.toMap.has(val) ? this.toMap.get(val).values() : [].values();
  }
}
