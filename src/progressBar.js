import ProgressBar from "progress";
import padEnd from "lodash/padEnd";

class ProgressBarController {
  constructor() {
    this.bar = null;
  }

  init(total) {
    if (this.bar) {
      this.terminate();
    }

    // Intentionally a noop because node-progress doesn't work well in non-TTY
    // environments
    if (!process.stdout.isTTY) {
      return;
    }

    // Don't do any of this while testing
    if (process.env.NODE_ENV === "lerna-test") {
      return;
    }

    this.bar = new ProgressBar(":packagename ╢:bar╟", {
      total: total,
      complete: "█",
      incomplete: "░",
      clear: true,

      // terminal columns - package name length - additional characters length
      width: (process.stdout.columns || 100) - 50 - 3
    });
  }

  tick(name) {
    if (this.bar) {
      this.bar.tick({
        packagename: padEnd(name.slice(0, 50), 50)
      });
    }
  }

  clear() {
    if (this.bar) {
      this.bar.terminate();
    }
  }

  restore() {
    if (this.bar) {
      // This is a hack to get the bar to redraw it's last state.
      // See: https://github.com/tj/node-progress/blob/d47913502ba5b551fcaad9e94fe7b2f5876a7939/lib/node-progress.js#L154-L159
      this.bar.stream.write(this.bar.lastDraw);
    }
  }

  terminate() {
    this.clear();
    this.bar = null;
  }
}

export default new ProgressBarController();
