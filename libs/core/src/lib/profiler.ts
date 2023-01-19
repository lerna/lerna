import fs from "fs-extra";
import npmlog from "npmlog";
import upath from "upath";

const hrtimeToMicroseconds = (hrtime: number[]) => {
  return (hrtime[0] * 1e9 + hrtime[1]) / 1000;
};

const range = (len: number) => {
  return (
    Array(len)
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .fill()
      .map((_, idx) => idx)
  );
};

const getTimeBasedFilename = () => {
  const now = new Date(); // 2011-10-05T14:48:00.000Z
  const datetime = now.toISOString().split(".")[0]; // 2011-10-05T14:48:00
  const datetimeNormalized = datetime.replace(/-|:/g, ""); // 20111005T144800
  return `Lerna-Profile-${datetimeNormalized}.json`;
};

export function generateProfileOutputPath(outputDirectory?: string) {
  return upath.join(upath.resolve(outputDirectory || "."), getTimeBasedFilename());
}

interface ProfilerConfig {
  concurrency: number;
  log?: typeof npmlog;
  outputDirectory?: string;
}

/**
 * A profiler to trace execution times across multiple concurrent calls.
 */
export class Profiler {
  events: any[];
  logger: npmlog.Logger;
  outputPath: string;
  threads: number[];

  constructor({ concurrency, log = npmlog, outputDirectory }: ProfilerConfig) {
    this.events = [];
    this.logger = log;
    this.outputPath = generateProfileOutputPath(outputDirectory);
    this.threads = range(concurrency);
  }

  run(fn: () => any, name: any) {
    let startTime: [number, number];
    let threadId: number | undefined;

    return Promise.resolve()
      .then(() => {
        startTime = process.hrtime();
        threadId = this.threads.shift();
      })
      .then(() => fn())
      .then((value) => {
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

        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.threads.unshift(threadId);
        this.threads.sort();

        return value;
      });
  }

  output() {
    return fs
      .outputJson(this.outputPath, this.events)
      .then(() => this.logger.info("profiler", `Performance profile saved to ${this.outputPath}`));
  }
}
