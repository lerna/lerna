var ProgressBar = require("progress");
var pad         = require("pad");

module.exports = function progressBar(total) {
  if (!process.stdout.isTTY) {
    // Intentionally a noop because node-progress doesn't work well in non-TTY
    // environments
    return function tick() {}
  }

  var bar = new ProgressBar(":packagename ╢:bar╟", {
    total: total,
    complete: "█",
    incomplete: "░",
    clear: true,

    // terminal columns - package name length - additional characters length
    width: (process.stdout.columns || 100) - 50 - 3
  });

  return function tick(name) {
    bar.tick({
      packagename: pad(name.slice(0, 50), 50)
    });
  };
};
