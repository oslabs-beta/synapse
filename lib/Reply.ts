/** Represents a response to a client. */
export default class Reply {
  /** An HTTP status code */
  status: number;

  /** The requested data */
  payload: any;

  /** Metadata associated with the reply. */
  metadata: any;

  /**
   * @param status See {@linkcode Reply.status|Reply.prototype.status}.
   * @param payload See {@linkcode Reply.payload|Reply.prototype.payload}.
   */
  constructor(status: number, payload: any = null) {
    this.status = status;
    this.payload = payload;
    this.metadata = {};
  }

  /** Checks if the instance's {@linkcode Reply.status|status} is a 4xx or 5xx error. */
  isError(): boolean {
    return ["4", "5"].includes(this.status.toString()[0]);
  }

  /**
   * @returns A string representation of the instance's {@linkcode Reply.payload|payload}.
   */
  toString(): string {
    if (this.payload === null || this.payload === undefined) {
      return "";
    }

    if (typeof this.payload === "string" || typeof this.payload === "number") {
      return <string>this.payload;
    }

    return JSON.stringify(this.payload);
  }

  /** @category Factory */
  static OK(payload: any = null) {
    return new Reply(200, payload);
  }

  /** @category Factory */
  static CREATED(payload: any = null) {
    return new Reply(201, payload);
  }

  /** @category Factory */
  static NO_CONTENT() {
    return new Reply(204);
  }

  /** @category Factory */
  static BAD_REQUEST(payload: any = null) {
    return new Reply(400, payload);
  }

  /** @category Factory */
  static UNAUTHORIZED(payload: any = null) {
    return new Reply(401, payload);
  }

  /** @category Factory */
  static FORBIDDEN(payload: any = null) {
    return new Reply(403, payload);
  }

  /** @category Factory */
  static NOT_FOUND(payload: any = null) {
    return new Reply(404, payload);
  }

  /** @category Factory */
  static CONFLICT(payload: any = null) {
    return new Reply(409, payload);
  }

  /** @category Factory */
  static INTERNAL_SERVER_ERROR(payload: any = null) {
    return new Reply(500, payload);
  }
}
