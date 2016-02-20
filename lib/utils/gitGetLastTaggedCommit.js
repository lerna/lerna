var execSync = require("./execSync");

module.exports = function gitGetLastTaggedCommit() {
  return execSync("git rev-list --tags --max-count=1");
};
