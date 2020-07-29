/* eslint-disable lines-between-class-members */
/* eslint-disable max-classes-per-file */
/* eslint-disable import/extensions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

/** Represents both 1) a response to a request, and 2) the state at a given _path_. Properties prefixed with ```$``` represent _metadata_ associated with the request/response cycle that produced the instance, while _payload_ data encompasses all other properties attached to the instance by derived classes. */
export default class State {
  /**
   * The derived class name of the instance.
   * @category Metadata
   */
  $type: string = null;
  /** An HTTP status code describing the response. */
  $status: number;
  /** A string describing the response. */
  $message: string = '';
  /** An HTTP query string representing the requested _path_ and validated arguments. */
  $query: string = null;
  /** An array of _paths_ upon which the response data depends. */
  $dependencies: Array<string> = [];

  /**
   * @param status The HTTP status code to be assigned to the instance's _metadata_.
   * @param message A string message to be assigned to the instance's _metadata_.
   */
  constructor(status: number, message: string = '') {
    this.$type = this.constructor.name;
    this.$status = status;
    this.$message = message;
  }

  /** Checks if the instance represents an error. */
  isError(): boolean {
    // return true if the status code is a 4xx or 5xx error
    return ['4', '5'].includes(this.$status.toString()[0]);
  }

  /** Returns a public representation of the instance _payload_. By default, this is the instance's {@linkcode State.$message|message}, though derived classes should override this behavior. */
  render(): any {
    return this.$message;
  }

  /** Returns a serialized version of the public representation of the instance for network transport. */
  serialize() {
    return JSON.stringify(this.render());
  }

  /** Adds the given states to the instance's {@linkcode State.$dependencies|dependencies}, such that when those states are invalidated, so will be the instance. */
  uses(...states: Array<State>) {
    states.forEach((state) => this.$dependencies.push(...state.$dependencies));
    return this;
  }

  /** Returns a public representation of the instance _metadata_, with the instance's {@linkcode State.render|rendered} _payload_ assigned to the property ```payload``` on the resulting object. Called when an the instance is converted to JSON via ```JSON.stringify```. */
  toJSON() {
    return {
      type: this.$type,
      status: this.$status,
      message: this.$message,
      query: this.$query,
      payload: this.render(),
    };
  }

  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static OK(message: any = null) {
    return new State(200, message);
  }
  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static CREATED(message: any = null) {
    return new State(201, message);
  }
  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static ACCEPTED(message: any = null) {
    return new State(202, message);
  }
  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static NO_CONTENT() {
    return new State(204);
  }
  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static BAD_REQUEST(message: any = null) {
    return new State(400, message);
  }
  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static UNAUTHORIZED(message: any = null) {
    return new State(401, message);
  }
  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static FORBIDDEN(message: any = null) {
    return new State(403, message);
  }
  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static NOT_FOUND(message: any = null) {
    return new State(404, message);
  }
  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static CONFLICT(message: any = null) {
    return new State(409, message);
  }
  /**
   * Creates a standard HTTP response.
   * @category Factory
   */
  static INTERNAL_SERVER_ERROR(message: any = null) {
    return new State(500, message);
  }
}
