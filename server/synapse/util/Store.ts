export default class Store {
  data: Map<string, any> = new Map();

  has(key) {
    return this.data.has(key);
  }

  get(key) {
    return this.data.get(key);
  }

  set(key, val) {
    return this.data.set(key, val);
  }

  delete(key) {
    return this.data.delete(key);
  }
}
