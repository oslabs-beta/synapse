export {};

/**
 * Represents a response to the client.
 */
class Reply {
  status: number;

  payload: any;

  constructor(status: number, payload: any = null) {
    this.status = status;
    this.payload = payload;
  }

  /*
    Checks if this.status is a 4xx or 5xx error.
  */
  isError() {
    return ["4", "5"].includes(this.status.toString()[0]);
  }

  toString() {
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
