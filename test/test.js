class Collection extends Array {
  test = "test";
}

const c = new Collection();
c[0] = "one";
console.log(c instanceof Collection);
