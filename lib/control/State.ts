/* eslint-disable import/extensions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

import HttpRespondable from "../abstract/HttpRespondable";

export default class State extends HttpRespondable {
  __meta__: {
    status: number;
    message: string;
    path: string | null;
    query: string | null;
    dependencies: Set<string>;
  };

  constructor(
    status: number,
    message: string = "",
    path: string = null,
    uses: Array<string> = [],
    query: string = null
  ) {
    super();

    if (!(status >= 100 && status < 600)) {
      throw new Error(`Invalid status '${status}'.`);
    }

    this.__meta__ = { status, message, path, dependencies: new Set(uses), query };
  }

  valueOf(): boolean {
    return !this.isError();
  }

  status(value: number = null): number {
    if (value) {
      this.__meta__.status = value;
    }
    return this.__meta__.status;
  }

  $message(value: string = null): string {
    if (value) {
      this.__meta__.message = value;
    }
    return this.__meta__.message;
  }

  path(value: string = null) {
    if (value) {
      this.__meta__.path = value;
    }
    return this.__meta__.path;
  }

  query(value: string = null) {
    if (value) {
      this.__meta__.query = value;
    }
    return this.__meta__.query;
  }

  dependencies(...paths: Array<string>): Array<string> {
    paths.forEach((path) => this.__meta__.dependencies.add(path));
    return Array.from(this.__meta__.dependencies);
  }

  render(): any {
    return this.__meta__.message;
  }

  /** Checks if the instance's {@linkcode State.status|status} is a 4xx or 5xx error. */
  isError(): boolean {
    return ["4", "5"].includes(this.status().toString()[0]);
  }
}
