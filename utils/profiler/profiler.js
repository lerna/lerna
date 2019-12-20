"use strict";

const figgyPudding = require("figgy-pudding");
const fs = require("fs-extra");
const npmlog = require("npmlog");
const upath = require("upath");

const hrtimeToMicroseconds = hrtime => {
  return (hrtime[0] * 1e9 + hrtime[1]) / 1000;
};

const range = len => {
  return Array(len)
    .fill()
    .map((_, idx) => idx);
};

const getTimeBasedFilename = () => {
  const now = new Date(); // 2011-10-05T14:48:00.000Z
  const datetime = now.toISOString().split(".")[0]; // 2011-10-05T14:48:00
  const datetimeNormalized = datetime.replace(/-|:/g, ""); // 20111005T144800
  return `Lerna-Profile-${datetimeNormalized}.json`;
};

const getOutputPath = (rootPath, profileLocation) => {
  const outputFolder = profileLocation ? upath.join(rootPath, profileLocation) : rootPath;
  return upath.join(outputFolder, getTimeBasedFilename());
};

const ProfilerConfig = figgyPudding({
  concurrency: {},
  log: { default: npmlog },
  profile: "enabled",
  enabled: {},
  profileLocation: {},
  rootPath: {},
});

class Profiler {
  constructor(opts) {
    const { concurrency, enabled, log, profileLocation, rootPath } = ProfilerConfig(opts);

    this.enabled = enabled;
    this.events = [];
    this.log = log;
    this.outputPath = getOutputPath(rootPath, profileLocation);
    this.threads = range(concurrency);
  }

  run(fn, name) {
    if (!this.enabled) {
      return fn();
    }

    let startTime;
    let threadId;

    return Promise.resolve()
      .then(() => {
        startTime = process.hrtime();
        threadId = this.threads.shift();
      })
      .then(() => fn())
      .then(value => {
        const duration = process.hrtime(startTime);

        // Trace Event Format documentation:
        // https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview
        const event = {
          name,
          ph: "X",
          ts: hrtimeToMicroseconds(startTime),
          pid: 1,
          tid: threadId,
          dur: hrtimeToMicroseconds(duration),
        };

        this.events.push(event);

        this.threads.unshift(threadId);
        this.threads.sort();

        return value;
      });
  }

  output() {
    if (!this.enabled) {
      return;
    }

    return fs
      .outputJson(this.outputPath, this.events)
      .then(() => this.log.info("profiler", `Performance profile saved to ${this.outputPath}`));
  }
}

module.exports = Profiler;
