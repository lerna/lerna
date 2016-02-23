var execSync = require("./execSync");

module.exports = function getCurrentSHA() {
  return execSync("git rev-parse HEAD");
}
