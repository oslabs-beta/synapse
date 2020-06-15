/* eslint-disable import/extensions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

export default class HttpRespondable {
  static OK(payload: any = null) {
    return new (<any>this)(200, payload);
  }

  static CREATED(payload: any = null) {
    return new (<any>this)(201, payload);
  }

  static NO_CONTENT() {
    return new (<any>this)(204);
  }

  static BAD_REQUEST(payload: any = null) {
    return new (<any>this)(400, payload);
  }

  static UNAUTHORIZED(payload: any = null) {
    return new (<any>this)(401, payload);
  }

  static FORBIDDEN(payload: any = null) {
    return new (<any>this)(403, payload);
  }

  static NOT_FOUND(payload: any = null) {
    return new (<any>this)(404, payload);
  }

  static CONFLICT(payload: any = null) {
    return new (<any>this)(409, payload);
  }

  static INTERNAL_SERVER_ERROR(payload: any = null) {
    return new (<any>this)(500, payload);
  }
}
