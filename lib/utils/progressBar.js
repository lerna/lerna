var ProgressBar = require("progress");
var pad         = require("pad");

var bar;

function init(total) {
  if (bar) {
    terminate();
  }

  // Intentionally a noop because node-progress doesn't work well in non-TTY
  // environments
  if (!process.stdout.isTTY) {
    return;
  }

  bar = new ProgressBar(":packagename ╢:bar╟", {
    total: total,
    complete: "█",
    incomplete: "░",
    clear: true,

    // terminal columns - package name length - additional characters length
    width: (process.stdout.columns || 100) - 50 - 3
  });
}

function tick(name) {
  if (bar) {
    bar.tick({
      packagename: pad(name.slice(0, 50), 50)
    });
  }
}

function clear() {
  if (bar) {
    bar.terminate();
  }
}

function restore() {
  if (bar) {
    // This is a hack to get the bar to redraw it's last state.
    // See: https://github.com/tj/node-progress/blob/d47913502ba5b551fcaad9e94fe7b2f5876a7939/lib/node-progress.js#L154-L159
    bar.stream.write(bar.lastDraw);
  }
}

function terminate() {
  clear();
  bar = null;
}

module.exports = {
  init: init,
  tick: tick,
  clear: clear,
  restore: restore,
  terminate: terminate
};
