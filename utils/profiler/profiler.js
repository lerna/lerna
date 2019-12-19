"use strict";

const fs = require("fs-extra");
const upath = require("upath");

const hrtimeToMicroseconds = hrtime => {
  return (hrtime[0] * 1e9 + hrtime[1]) / 1000;
};

const range = len => {
  return Array(len)
    .fill()
    .map((_, idx) => idx);
};

const generateOutputname = () => {
  const now = new Date(); // 2011-10-05T14:48:00.000Z
  const datetime = now.toISOString().split(".")[0]; // 2011-10-05T14:48:00
  const datetimeNormalized = datetime.replace(/-|:/g, ""); // 20111005T144800
  return `Lerna-Profile-${datetimeNormalized}.json`;
};

class Profiler {
  constructor({ concurrency, log, profile, profileLocation, rootPath }) {
    this.events = [];
    this.profile = profile;
    this.log = log;
    this.profileLocation = profileLocation;
    this.rootPath = rootPath;
    this.threads = range(concurrency);
  }

  run(fn, name) {
    if (!this.profile) {
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
    if (!this.profile) {
      return;
    }

    const outputFolder = this.profileLocation
      ? upath.join(this.rootPath, this.profileLocation)
      : this.rootPath;
    const outputPath = upath.join(outputFolder, generateOutputname());

    return fs
      .outputJson(outputPath, this.events)
      .then(() => this.log.info("profiler", `Performance profile saved to ${outputPath}`));
  }
}

module.exports = Profiler;
