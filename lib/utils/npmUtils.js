var execSync = require("./execSync");
var logger   = require("./logger");
var child    = require("child_process");

var installInDir = logger.logifyAsync("npmUtils.installInDir", function (dir, callback) {
  child.exec("npm install", {
    cwd: dir
  }, function (err, stdout, stderr) {
    if (err != null) {
      callback(stderr);
    } else {
      callback();
    }
  });
});

var addDistTag = logger.logifySync("npmUtils.removeDistTag", function (packageName, version, tag) {
  execSync("npm dist-tag add " + packageName + "@" + version + " " + tag);
});

var removeDistTag = logger.logifySync("npmUtils.removeDistTag", function (packageName, tag) {
  execSync("npm dist-tag rm " + packageName + " " + tag);
});

var checkDistTag = logger.logifySync("npmUtils.checkDistTag", function (packageName, tag) {
  return execSync("npm dist-tag ls " + packageName).indexOf(tag) >= 0;
});

var runScriptInside = logger.logifyAsync("npmUtils.runScriptInside", function (script, args, cwd, callback) {
  child.exec("npm run " + script + " " + args.join(" "), {
    cwd: cwd
  }, function (err, stdout, stderr) {
    callback(stderr || err, stdout);
  });
});

var publishTaggedInDir = logger.logifyAsync("npmUtils.publishTaggedInDir", function(tag, dir, callback) {
  child.exec("cd " + dir + " && npm publish --tag " + tag, function (err, stdout, stderr) {
    callback(stderr || err, stdout);
  });
});

module.exports = {
  installInDir: installInDir,
  addDistTag: addDistTag,
  checkDistTag: checkDistTag,
  removeDistTag: removeDistTag,
  runScriptInside: runScriptInside,
  publishTaggedInDir: publishTaggedInDir
};
