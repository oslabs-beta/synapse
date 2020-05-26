export {};
<<<<<<< HEAD

class Resource {}

module.exports = Resource;
=======
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
>>>>>>> 38e5ac8b8b958d6fa382e58978daa755a69d505a
