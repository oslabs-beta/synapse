/* eslint-disable import/extensions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

import { invokeChain } from "../utilities";

export default class State {
  __meta__: any = {};

  constructor(status: number, message: string = "") {
    Object.assign(this.__meta__, {
      status: status >= 100 && status < 600 ? status : 500,
      message,
      path: null,
      dependencies: new Set<string>(),
    });
  }

  status(): number {
    return this.__meta__.status;
  }

  dependencies(): Array<string> {
    return Array.from(this.__meta__.dependencies);
  }

  /** Checks if the instance's {@linkcode State.status|status} is a 4xx or 5xx error. */
  isError(): boolean {
    return ["4", "5"].includes(this.status().toString()[0]);
  }

  render(): any {
    return this.__meta__.message;
  }

  static async evaluate(fns, ...args) {
    const chain = Array.isArray(fns) ? fns : [fns];

    let result;

    try {
      result = await invokeChain(chain, ...args);

      if (!(result instanceof State)) {
        console.log("Unexpected result:", result);
        throw new Error();
      }
    } catch (err) {
      console.log(err);
      result = State.INTERNAL_SERVER_ERROR("An error occurred.");
    }

    return result;
  }

  /** @category Factory */
  static OK(payload: any = null) {
    return new State(200, payload);
  }

  /** @category Factory */
  static CREATED(payload: any = null) {
    return new State(201, payload);
  }

  /** @category Factory */
  static NO_CONTENT() {
    return new State(204);
  }

  /** @category Factory */
  static BAD_REQUEST(payload: any = null) {
    return new State(400, payload);
  }

  /** @category Factory */
  static UNAUTHORIZED(payload: any = null) {
    return new State(401, payload);
  }

  /** @category Factory */
  static FORBIDDEN(payload: any = null) {
    return new State(403, payload);
  }

  /** @category Factory */
  static NOT_FOUND(payload: any = null) {
    return new State(404, payload);
  }

  /** @category Factory */
  static CONFLICT(payload: any = null) {
    return new State(409, payload);
  }

  /** @category Factory */
  static INTERNAL_SERVER_ERROR(payload: any = null) {
    return new State(500, payload);
  }
}
