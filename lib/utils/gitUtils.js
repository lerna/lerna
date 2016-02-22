var logger = require("./logger");
var execSync = require("./execSync");

var addFile = logger.logifySync("gitUtils.addFile", function (file) {
  execSync("git add " + file);
});

var commit = logger.logifySync("gitUtils.commit", function (message) {
  // Use echo to allow multi\nline strings.
  execSync("git commit -m \"$(echo \"" + message + "\")\"");
});

var addTag = logger.logifySync("gitUtils.addTag", function (tag) {
  execSync("git tag " + tag);
});

var removeTag = logger.logifySync("gitUtils.removeTag", function (tag) {
  execSync("git tag -d " + tag);
});

var hasTags = logger.logifySync("gitUtils.hasTags", function () {
  return !!execSync("git tag");
});

var getLastTaggedCommit = logger.logifySync("gitUtils.getLastTaggedCommit", function () {
  return execSync("git rev-list --tags --max-count=1");
});

var getFirstCommit = logger.logifySync("gitUtils.getFirstCommit", function () {
  execSync("git rev-list --max-parents=0 HEAD");
});

var pushWithTags = logger.logifySync("gitUtils.pushWithTags", function (tags) {
  execSync("git push");
  execSync("git push origin " + tags.join(" "));
});

var describeTag = logger.logifySync("gitUtils.describeTag", function (commit) {
  return execSync("git describe --tags " + commit);
});

var diffSinceIn = logger.logifySync("gitUtils.diffSinceIn", function (since, location) {
  return execSync("git diff " + since + " -- " + location);
});

module.exports = {
  addFile: addFile,
  commit: commit,
  addTag: addTag,
  removeTag: removeTag,
  hasTags: hasTags,
  getLastTaggedCommit: getLastTaggedCommit,
  getFirstCommit: getFirstCommit,
  pushWithTags: pushWithTags,
  describeTag: describeTag,
  diffSinceIn: diffSinceIn
};
