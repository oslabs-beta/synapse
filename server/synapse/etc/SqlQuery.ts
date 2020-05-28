/* eslint-disable prefer-destructuring */
module.exports = class Query {
  table;

  columns;

  values;

  conditions;

  action;

  static $(frags = null, ...values) {
    if (!frags) {
      return ["", []];
    }

    if (typeof frags === "string") {
      return [frags, []];
    }

    let result = frags.shift();
    frags.forEach((frag, i) => {
      result += `$${i + 1}${frag}`;
    });
    return [result, values];
  }

  from(table: string) {
    this.table = table;
    return this;
  }

  where(...args: any) {
    this.conditions = Query.$(...args);
    return this;
  }

  select(...columns) {
    if (Array.isArray(columns[0])) {
      this.columns = Query.$(...columns)[0];
    } else {
      this.columns = columns.join(", ");
    }
    this.action = "SELECT";
    return this;
  }

  insert(data) {
    const values = Object.values(data);
    this.columns = Object.keys(data).join(", ");
    this.values = [values.map((val, i) => `$${i + 1}`), values];
    this.action = "INSERT";
    return this;
  }

  toString() {
    if (this.action === "SELECT") {
      let query = `SELECT ${this.columns} FROM ${this.table}`;
      let values = [];
      if (this.conditions) {
        query = `${query} WHERE ${this.conditions[0]}`;
        values = this.conditions[1];
      }
      return [`${query};`, values];
    }
    if (this.action === "INSERT") {
      return [
        `INSERT INTO ${this.table}(${this.columns}) VALUES(${this.values[0]});`,
        this.values[1],
      ];
    }
    return "";
  }
};
