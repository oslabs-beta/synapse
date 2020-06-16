/* eslint-disable import/extensions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

import HttpRespondable from "../abstract/HttpRespondable";

export default class State extends HttpRespondable {
  $: {
    type: string;
    status: number;
    message: string;
    path: string | null;
    query: string | null;
    dependencies: Set<string>;
    flags: object;
  };

  constructor(
    status: number,
    message: string = "",
    path: string = null,
    uses: Array<string> = [],
    query: string = null,
    flags: object = {}
  ) {
    super();

    if (!(status >= 100 && status < 600)) {
      throw new Error(`Invalid status '${status}'.`);
    }

    this.$ = {
      type: this.constructor.name,
      status,
      message,
      path,
      dependencies: new Set(uses),
      query,
      flags,
    };
  }

  $status(value: number = null): number {
    if (value) {
      this.$.status = value;
    }
    return this.$.status;
  }

  $message(value: string = null): string {
    if (value) {
      this.$.message = value;
    }
    return this.$.message;
  }

  $path(value: string = null) {
    if (value) {
      this.$.path = value;
    }
    return this.$.path;
  }

  $query(value: string = null) {
    if (value) {
      this.$.query = value;
    }
    return this.$.query;
  }

  $dependencies(...paths: Array<string>): Array<string> {
    paths.forEach((path) => this.$.dependencies.add(path));
    return Array.from(this.$.dependencies);
  }

  $flags(value: any = null) {
    if (value) {
      this.$.flags = value;
    }
    return this.$.flags;
  }

  /** Checks if the instance's {@linkcode State.status|status} is a 4xx or 5xx error. */
  isError(): boolean {
    return ["4", "5"].includes(this.$status().toString()[0]);
  }

  render(): any {
    return this.$.message;
  }

  toJSON() {
    return { ...this.$, payload: this.render() };
  }
}
