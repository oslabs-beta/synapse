/* eslint-disable class-methods-use-this */

export default class State {
  __meta__: any = {};

  status(): number {
    throw new Error("Classes that extend State must implement the 'status' method.");
  }

  isError(): boolean {
    throw new Error("Classes that extend State must implement the 'isError' method.");
  }

  toObject(): object {
    throw new Error("Classes that extend State must implement the 'toObject' method.");
  }

  getRefs(): Array<string> {
    throw new Error("Classes that extend State must implement the 'getRefs' method.");
  }
}
