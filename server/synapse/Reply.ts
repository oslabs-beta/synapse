export {};

/**
 * A Class that contains potential responses to the client when certain conditions are met.
 * The responses are methods that are called to provide a status and/or message.
 */
class Reply {
  status: number;

  payload: any;

  constructor(status: number, payload: any = null) {
    this.status = status;
    this.payload = payload;
  }

  /**
   * Checks if this.status is a 4xx or 5xx error.
   */
  isError() {
    return ["4", "5"].includes(this.status.toString()[0]);
  }

  /**
   * Serializes its inputs by turning them into a string.
   * @returns The input if it is a string, an empty string if the input is null or undefined, or a stringified version of the input.
   */
  serialize() {
    if (this.payload === null || this.payload === undefined) {
      return "";
    }

    if (typeof this.payload === "string" || typeof this.payload === "number") {
      return this.payload;
    }

    return JSON.stringify(this.payload);
  }

  static OK(payload: any = null) {
    return new Reply(200, payload);
  }

  static CREATED(payload: any = null) {
    return new Reply(201, payload);
  }

  static NO_CONTENT() {
    return new Reply(201);
  }

  static BAD_REQUEST(payload: any = null) {
    return new Reply(400, payload);
  }

  static UNAUTHORIZED(payload: any = null) {
    return new Reply(401, payload);
  }

  static FORBIDDEN(payload: any = null) {
    return new Reply(403, payload);
  }

  static NOT_FOUND(payload: any = null) {
    return new Reply(404, payload);
  }

  static CONFLICT(payload: any = null) {
    return new Reply(409, payload);
  }

  static INTERNAL_SERVER_ERROR(payload: any = null) {
    return new Reply(500, payload);
  }
}

module.exports = Reply;
