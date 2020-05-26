export {};
const Schema = require("./Schema");

class Resource {
  static async create(data: object) {
    const Type: any = this;
    return Type.schema.validate(data).then((result) => {
      if (!result) {
        throw new Error();
      }
      const instance = new Type();
      Object.keys(result).forEach((key) => {
        instance[key] = result[key];
      });
      return instance;
    });
  }
}
module.exports = Resource;

// get users fields obj
// use that obj to construct schema
// use validate from schema
