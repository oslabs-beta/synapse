/* eslint-disable consistent-return */

export default class Store {
  state: Map<string, any> = new Map();

  source: Map<string, Function> = new Map();

  has(key: string) {
    return this.source.has(key);
  }

  read(key: string) {
    return this.state.get(key);
  }

  async set(key: string, source: Function) {
    this.source.set(key, source);
    this.state.set(key, await source());
    return this.read(key);
  }

  async reset(key: string) {
    if (this.has(key)) {
      this.state.set(key, await this.source.get(key)());
      return this.read(key);
    }
  }

  remove(key: string) {
    this.state.delete(key);
    this.source.delete(key);
  }
}
