export default class Relation<F, T> {
  fromMap: Map<F, Set<T>> = new Map();

  toMap: Map<T, Set<F>> = new Map();

  link(from: F, to: T, reverse: boolean = true) {
    if (!this.fromMap.has(from)) {
      this.fromMap.set(from, new Set());
    }
    this.fromMap.get(from).add(to);

    if (reverse) {
      if (!this.toMap.has(to)) {
        this.toMap.set(to, new Set());
      }
      this.toMap.get(to).add(from);
    }
  }

  point(from: F, to: T) {
    return this.link(from, to, false);
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

  from(val: F | Array<F>): Array<T> {
    const result = [];
    (Array.isArray(val) ? val : [val]).forEach((el) => {
      if (this.fromMap.has(el)) {
        result.push(...Array.from(this.fromMap.get(el)));
      }
    });
    return result;
  }

  to(val: T | Array<T>): Array<F> {
    const result = [];
    (Array.isArray(val) ? val : [val]).forEach((el) => {
      if (this.toMap.has(el)) {
        result.push(...Array.from(this.toMap.get(el)));
      }
    });
    return result;
  }
}
