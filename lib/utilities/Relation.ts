export default class Relation<F, T> {
  fromMap: Map<F, Set<T>> = new Map();

  toMap: Map<T, Set<F>> = new Map();

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

  from(val: F): Array<T> {
    return Array.from(this.fromMap.get(val) || []);
  }

  to(val: T): Array<F> {
    return Array.from(this.toMap.get(val) || []);
  }
}
