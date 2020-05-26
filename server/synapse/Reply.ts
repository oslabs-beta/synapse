export {};

class Reply {
  status: number;

  payload: any;

  constructor(status: number, payload: any = null) {
    this.status = status;
    this.payload = payload;
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
