/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Adapted from https://github.com/npm/npmlog/blob/756bd05d01e7e4841fba25204d6b85dfcffeba3c/lib/log.js
 */

import { EventEmitter } from "node:events";
import { WriteStream } from "node:tty";
import util from "node:util";
import { TrackerGroup } from "./are-we-there-yet/tracker-group";
import { Gauge } from "./gauge";

const setBlocking = require("set-blocking");
const consoleControl = require("console-control-strings");

setBlocking(true);

export class Logger extends EventEmitter {
  private _stream: WriteStream | null;
  private _paused: boolean;
  private _buffer: any[];
  private unicodeEnabled: boolean | undefined;
  private colorEnabled: boolean | undefined;
  private id: number;
  record: any[];
  maxRecordSize: number;
  gauge: any;
  tracker: any;
  progressEnabled: boolean;
  level: string;
  prefixStyle: any;
  headingStyle: any;
  style: any;
  levels: any;
  disp: any;
  heading: string | undefined;

  // Known log levels, assigned dynamically in the constructor
  silly!: (prefix: string, ...messageArgs: any[]) => void;
  verbose!: (prefix: string, ...messageArgs: any[]) => void;
  info!: (prefix: string, ...messageArgs: any[]) => void;
  timing!: (prefix: string, ...messageArgs: any[]) => void;
  http!: (prefix: string, ...messageArgs: any[]) => void;
  notice!: (prefix: string, ...messageArgs: any[]) => void;
  warn!: (prefix: string, ...messageArgs: any[]) => void;
  error!: (prefix: string, ...messageArgs: any[]) => void;
  silent!: (prefix: string, ...messageArgs: any[]) => void;

  [dynamicallyAddedLogLevelMethod: string]: any;

  constructor() {
    super();
    this._stream = process.stderr;
    this._paused = false;
    this._buffer = [];
    this.unicodeEnabled = false;
    this.colorEnabled = undefined;
    this.id = 0;
    this.record = [];
    this.maxRecordSize = 10000;
    this.level = "info";

    this.prefixStyle = { fg: "magenta" };
    this.headingStyle = { fg: "white", bg: "black" };
    this.style = {};
    this.levels = {};
    this.disp = {};

    this.gauge = new Gauge(this._stream, {
      enabled: false,
      theme: { hasColor: this.useColor() },
      template: [
        { type: "progressbar", length: 20 },
        { type: "activityIndicator", kerning: 1, length: 1 },
        { type: "section", default: "" },
        ":",
        { type: "logline", kerning: 1, default: "" },
      ],
    });

    this.tracker = new TrackerGroup();
    this.progressEnabled = this.gauge.isEnabled();

    this.addLevel("silly", -Infinity, { inverse: true }, "sill");
    this.addLevel("verbose", 1000, { fg: "cyan", bg: "black" }, "verb");
    this.addLevel("info", 2000, { fg: "green" });
    this.addLevel("timing", 2500, { fg: "green", bg: "black" });
    this.addLevel("http", 3000, { fg: "green", bg: "black" });
    this.addLevel("notice", 3500, { fg: "cyan", bg: "black" });
    this.addLevel("warn", 4000, { fg: "black", bg: "yellow" }, "WARN");
    this.addLevel("error", 5000, { fg: "red", bg: "black" }, "ERR!");
    this.addLevel("silent", Infinity);

    this.on("error", () => {});
  }

  get stream(): WriteStream | null {
    return this._stream;
  }

  set stream(newStream: WriteStream | null) {
    this._stream = newStream;
    if (this.gauge) {
      this.gauge.setWriteTo(this._stream, this._stream);
    }
  }

  useColor(): boolean {
    return this.colorEnabled != null ? this.colorEnabled : this._stream?.isTTY ?? false;
  }

  enableColor(): void {
    this.colorEnabled = true;
    this.gauge.setTheme({ hasColor: this.colorEnabled, hasUnicode: this.unicodeEnabled });
  }

  disableColor(): void {
    this.colorEnabled = false;
    this.gauge.setTheme({ hasColor: this.colorEnabled, hasUnicode: this.unicodeEnabled });
  }

  enableUnicode(): void {
    this.unicodeEnabled = true;
    this.gauge.setTheme({ hasColor: this.useColor(), hasUnicode: this.unicodeEnabled });
  }

  disableUnicode(): void {
    this.unicodeEnabled = false;
    this.gauge.setTheme({ hasColor: this.useColor(), hasUnicode: this.unicodeEnabled });
  }

  setGaugeThemeset(themes: any): void {
    this.gauge.setThemeset(themes);
  }

  setGaugeTemplate(template: any): void {
    this.gauge.setTemplate(template);
  }

  enableProgress(): void {
    if (this.progressEnabled || this._paused) {
      return;
    }
    this.progressEnabled = true;
    this.tracker.on("change", this.showProgress.bind(this));
    this.gauge.enable();
  }

  disableProgress(): void {
    if (!this.progressEnabled) {
      return;
    }
    this.progressEnabled = false;
    this.tracker.removeListener("change", this.showProgress.bind(this));
    this.gauge.disable();
  }

  clearProgress(cb?: () => void): void {
    if (!this.progressEnabled) {
      return cb && process.nextTick(cb);
    }
    this.gauge.hide(cb);
  }

  showProgress(name?: string, completed?: number): void {
    if (!this.progressEnabled) {
      return;
    }
    const values: any = {};
    if (name) {
      values.section = name;
    }
    const last = this.record[this.record.length - 1];
    if (last) {
      values.subsection = last.prefix;
      const disp = this.disp[last.level];
      let logline = this._format(disp, this.style[last.level]);
      if (last.prefix) {
        logline += " " + this._format(last.prefix, this.prefixStyle);
      }
      logline += " " + last.message.split(/\r?\n/)[0];
      values.logline = logline;
    }
    values.completed = completed || this.tracker.completed();
    this.gauge.show(values);
  }

  pause(): void {
    this._paused = true;
    if (this.progressEnabled) {
      this.gauge.disable();
    }
  }

  resume(): void {
    if (!this._paused) {
      return;
    }
    this._paused = false;
    const buffer = this._buffer;
    this._buffer = [];
    buffer.forEach((m) => this.emitLog(m));
    if (this.progressEnabled) {
      this.gauge.enable();
    }
  }

  log(lvl: string, prefix: string, ...messageArgs: any[]): void {
    const l = this.levels[lvl];
    if (l === undefined) {
      this.emit("error", new Error(util.format("Undefined log level: %j", lvl)));
      return;
    }
    let stack = null;
    const a = messageArgs.map((arg) => {
      if (arg instanceof Error && arg.stack) {
        Object.defineProperty(arg, "stack", {
          value: (stack = arg.stack + ""),
          enumerable: true,
          writable: true,
        });
      }
      return arg;
    });
    if (stack) {
      a.unshift(stack + "\n");
    }
    const message = util.format(...a);
    const m = {
      id: this.id++,
      level: lvl,
      prefix: String(prefix || ""),
      message,
      messageRaw: a,
    };
    this.emit("log", m);
    this.emit(`log.${lvl}`, m);
    if (m.prefix) {
      this.emit(m.prefix, m);
    }
    this.record.push(m);
    const mrs = this.maxRecordSize;
    if (this.record.length > mrs) {
      this.record = this.record.slice(-Math.floor(mrs * 0.9));
    }
    this.emitLog(m);
  }

  emitLog(m: { prefix: string; level: string | number; message?: string }): void {
    if (this._paused) {
      this._buffer.push(m);
      return;
    }
    if (this.progressEnabled) {
      this.gauge.pulse(m.prefix);
    }
    const l = this.levels[m.level];
    if (l === undefined || l < this.levels[this.level] || (l > 0 && !isFinite(l))) {
      return;
    }
    const disp = this.disp[m.level];
    this.clearProgress();
    m.message?.split(/\r?\n/).forEach((line) => {
      const heading = this.heading;
      if (heading) {
        this.write(heading, this.headingStyle);
        this.write(" ");
      }
      this.write(disp, this.style[m.level]);
      const p = m.prefix || "";
      if (p) {
        this.write(" ");
      }
      this.write(p, this.prefixStyle);
      this.write(" " + line + "\n");
    });
    this.showProgress();
  }

  _format(
    msg: string,
    style?: {
      fg?: string;
      bg?: string;
      bold?: boolean;
      underline?: boolean;
      inverse?: boolean;
      beep?: boolean;
    }
  ): string | void {
    if (!this._stream) {
      return;
    }
    let output = "";
    if (this.useColor()) {
      style = style || {};
      const settings = [];
      if (style.fg) settings.push(style.fg);
      if (style.bg) settings.push("bg" + style.bg[0].toUpperCase() + style.bg.slice(1));
      if (style.bold) settings.push("bold");
      if (style.underline) settings.push("underline");
      if (style.inverse) settings.push("inverse");
      if (settings.length) output += consoleControl.color(settings);
      if (style.beep) output += consoleControl.beep();
    }
    output += msg;
    if (this.useColor()) output += consoleControl.color("reset");
    return output;
  }

  write(
    msg: string,
    style?: {
      fg?: string;
      bg?: string;
      bold?: boolean;
      underline?: boolean;
      inverse?: boolean;
      beep?: boolean;
    }
  ): void {
    if (!this._stream) {
      return;
    }
    this._stream.write(this._format(msg, style) as any);
  }

  addLevel(lvl: string | number, n: any, style?: any, disp: string | number | null = null): void {
    if (disp == null) {
      disp = lvl as string;
    }
    this.levels[lvl] = n;
    this.style[lvl] = style;
    if (!this[lvl]) {
      this[lvl] = (...args: any[]) => {
        const a: any = [lvl, ...args];
        // eslint-disable-next-line prefer-spread
        return this.log.apply(this, a);
      };
    }
    this.disp[lvl] = disp;
  }
}

const log = new Logger();

const trackerConstructors = ["newGroup", "newItem", "newStream"];

const mixinLog = function (tracker: { [x: string]: () => any }) {
  // mixin the public methods from log into the tracker
  // (except: conflicts and one's we handle specially)
  Array.from(
    new Set([...Object.keys(log), ...Object.getOwnPropertyNames(Object.getPrototypeOf(log))])
  ).forEach(function (P) {
    if (P[0] === "_") {
      return;
    }

    if (
      trackerConstructors.filter(function (C) {
        return C === P;
      }).length
    ) {
      return;
    }

    if (tracker[P]) {
      return;
    }

    if (typeof log[P] !== "function") {
      return;
    }

    const func = log[P];
    tracker[P] = function () {
      // eslint-disable-next-line prefer-rest-params
      return func.apply(log, arguments);
    };
  });
  // if the new tracker is a group, make sure any subtrackers get
  // mixed in too
  if (tracker instanceof TrackerGroup) {
    trackerConstructors.forEach(function (C) {
      const func = tracker[C];
      tracker[C] = function () {
        // eslint-disable-next-line prefer-rest-params
        return mixinLog(func.apply(tracker, arguments as any));
      };
    });
  }
  return tracker;
};

// Add tracker constructors to the top level log object
trackerConstructors.forEach(function (C) {
  log[C] = function () {
    // eslint-disable-next-line prefer-spread, prefer-rest-params
    return mixinLog(this.tracker[C].apply(this.tracker, arguments));
  };
});

export default log;
