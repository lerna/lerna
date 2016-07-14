var ProgressBar = require("progress");
var pad         = require("pad");

module.exports = function (total) {

  var COLUMNS = process.stdout.columns || 100
  if (! process.stderr.cursorTo) {
    process.stderr.columns = COLUMNS;
    process.stderr.isTTY = true;
    process.stderr.cursorTo = function (column) {
      process.stderr.write("\u001b[" + COLUMNS + "D");
      if (column) {
          process.stderr.write("\u001b[" + column + "C");
      }
    };
    process.stderr.clearLine = function () {
      this.cursorTo(0)
      process.stderr.write("\u001b[K");
    };
  }

  var bar = new ProgressBar(":packagename ╢:bar╟", {
    total: total,
    complete: "█",
    incomplete: "░",
    clear: true,
    // terminal columns - package name length - additional characters length
    width: COLUMNS - 50 - 3
  });

  return function (name) {
    bar.tick({
      packagename: pad(name.slice(0, 50), 50)
    });
  };
};
