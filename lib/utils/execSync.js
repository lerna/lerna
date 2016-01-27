var child = require("child_process");

module.exports = function execSync(cmd) {
  return child.execSync(cmd, {
    encoding: "utf8"
  }).trim();
};
