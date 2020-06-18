/* eslint-disable lines-between-class-members */
/* eslint-disable prefer-destructuring */

export default class Query {
  table: string;
  columns: string;
  values: Array<any>;
  conditions: Array<any>;
  action: string;

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

  from(table: any) {
    this.table = Array.isArray(table) ? table[0] : table;
    return this;
  }

  into(table: any) {
    return this.from(table);
  }

  where(...args: any) {
    if (Array.isArray(args[0])) {
      this.conditions = Query.$(...args);
    } else if (typeof args[0] === "object") {
      const data = args[0];
      const text = [];
      Object.keys(data).forEach((key, i) => {
        text.push(`${key}=$${i + 1}`);
      });
      this.conditions = [text.join(", "), Object.values(data)];
    }
    return this;
  }

  select(...columns) {
    if (!columns.length) {
      this.columns = "*";
    } else if (Array.isArray(columns[0])) {
      this.columns = Query.$(...columns)[0];
    } else if (typeof columns[0] === "object") {
      this.columns = Object.keys(columns[0]).join(", ");
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

  evaluate() {
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
      return [`INSERT INTO ${this.table}(${this.columns}) VALUES(${this.values[0]});`, this.values[1]];
    }
    return "";
  }
}
