var execSync = require("./execSync");

module.exports = function gitHasTags() {
  return !!execSync("git tag");
};
