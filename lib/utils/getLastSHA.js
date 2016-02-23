var execSync = require("./execSync");

module.exports = function getLastSHA() {
  return execSync("git rev-parse HEAD");
}
