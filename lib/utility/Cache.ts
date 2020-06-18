/* eslint-disable eqeqeq */
/* eslint-disable no-param-reassign */

export default class Cache {
  static state: Map<string, any> = new Map();

  static source: Map<string, Function> = new Map();

  static has(key: string) {
    return this.source.has(key);
  }

  static remove(key: string) {
    this.state.delete(key);
    this.source.delete(key);
  }

  static get(key: string) {
    return this.state.get(key);
  }

  static async set(key: string, source: Function = null) {
    if (source) {
      this.source.set(key, source);
    } else {
      source = this.source.get(key);
    }

    const state = await source();
    this.state.set(key, state);
    return state;
  }
}
