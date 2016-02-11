var chalk = require("chalk");
var child = require("child_process");
var async = require("async");
var path  = require("path");

module.exports = function runScriptInPackages(packages, script, args, callback) {
  async.parallelLimit(packages.map(function (pkg) {
    return function run(done) {
      child.exec("npm run " + script + " " + args.join(" "), {
        cwd: path.dirname(pkg.loc)
      }, function (err, stdout, stderr) {
        if (err || stderr) {
          err = stderr || err.stack;
          console.log(chalk.red(err));
          done(err);
        } else {
          console.log(stdout);
          done();
        }
      });
    };
  }), 4, callback);
};
