var execSync = require("./execSync");

module.exports = function gitAddFile(file) {
  execSync("git add " + file);
};
