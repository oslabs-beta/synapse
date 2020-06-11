/* eslint-disable import/extensions */

import Text from "./Text";

export default class Id extends Text {
  constructor(length = null, flags = null) {
    super(length, length, null, flags);

    this.assert(/[^\w-]/, false, "must contain only alphanumeric characters, underscores and dashes");
  }
}
