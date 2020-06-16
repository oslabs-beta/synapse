/* eslint-disable no-bitwise */

/** Abstract class representing a subset of any primitive value type, herein referred to as a _fieldtype_. For example, a hypothetical ```class Email extends Field``` would represent a subset of ```string``` (i.e. strings that are valid email addresses). A class which extends {@linkcode Field} should define the requirements of its _fieldtype_ by overriding {@linkcode Field.parse|Field.prototype.parse}. Instances of {@linkcode Field} are used to validate values and compose {@linkcode Schema|Schemas}. */
export default class Field {
  static Flags = {
    /** _PRIVATE_ denotes that a field should not be exposed. */
    PRV: 0b010,
  };

  /** The value to be returned from {@linkcode Field.parse|Field.prototype.parse} when invoked with ```undefined``` or ```null```. Note that providing a defualt value effectively renders the field optional. */
  default: any;

  /** A bit field representing a set of boolean {@linkcode Field.Flags|flags}. */
  flags: number;

  /** The error message produced by the last call to {@linkcode Field.parse|Field.prototype.parse}, if it was unsuccessful. */
  lastError: string;

  /**
   * @param defaultVal A {@linkcode Field.default|default} value.
   * @param flags A bit field.
   */
  constructor(defaultVal: any = undefined, flags: number = null) {
    this.default = defaultVal;
    this.flags = flags;
  }

  /** Checks if the specified flag is set on {@linkcode Field.flags|Field.prototype.flags}.
   * @param flag A bit mask.
   * @returns A boolean determining whether or not the flag is present.
   */
  hasFlag(flag: number): boolean {
    return !!(this.flags & flag);
  }

  clone() {
    const Type = <{ new (): Field }>this.constructor;
    return Object.assign(new Type(), this);
  }

  /** _**(async)**_ Checks if the input ```value``` is, or can be converted to, a valid case of the instance's _fieldtype_. If the input is ```null``` or ```undefined```, uses the {@linkcode Field.default|default} value in its place.
   * @param value The value to be parsed.
   * @returns The parsed value, or ```undefined``` if the ```input``` was invalid.
   */
  async parse(value: any): Promise<any> {
    this.lastError = null;
    if (value === undefined || value === null) {
      return this.default;
    }
    return value;
  }
}
