/**
 * Adapted from https://github.com/npm/npmlog/blob/756bd05d01e7e4841fba25204d6b85dfcffeba3c/test/basic.js
 */
import stream from "node:stream";

import log, { Logger } from "../";

const result: any[] = [];
const logEvents: any[] = [];
const logInfoEvents: any[] = [];
const logPrefixEvents: any[] = [];

const resultExpect = [
  // eslint-disable-next-line max-len
  '\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[7msill\u001b[0m \u001b[0m\u001b[35msilly prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[36;40mverb\u001b[0m \u001b[0m\u001b[35mverbose prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32minfo\u001b[0m \u001b[0m\u001b[35minfo prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32;40mtiming\u001b[0m \u001b[0m\u001b[35mtiming prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32;40mhttp\u001b[0m \u001b[0m\u001b[35mhttp prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[36;40mnotice\u001b[0m \u001b[0m\u001b[35mnotice prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[30;43mWARN\u001b[0m \u001b[0m\u001b[35mwarn prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35merror prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32minfo\u001b[0m \u001b[0m\u001b[35minfo prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32;40mtiming\u001b[0m \u001b[0m\u001b[35mtiming prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32;40mhttp\u001b[0m \u001b[0m\u001b[35mhttp prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[36;40mnotice\u001b[0m \u001b[0m\u001b[35mnotice prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[30;43mWARN\u001b[0m \u001b[0m\u001b[35mwarn prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35merror prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
  // eslint-disable-next-line max-len
  "\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35m404\u001b[0m This is a longer\n",
  // eslint-disable-next-line max-len
  "\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35m404\u001b[0m message, with some details\n",
  // eslint-disable-next-line max-len
  "\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35m404\u001b[0m and maybe a stack.\n",
  // eslint-disable-next-line max-len
  "\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35m404\u001b[0m \n",
  // eslint-disable-next-line max-len
  "\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u0007noise\u001b[0m\u001b[35m\u001b[0m LOUD NOISES\n",
  // eslint-disable-next-line max-len
  "\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u0007noise\u001b[0m \u001b[0m\u001b[35merror\u001b[0m erroring\n",
  "\u001b[0m",
];

const logPrefixEventsExpect = [
  {
    id: 2,
    level: "info",
    prefix: "info prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 11,
    level: "info",
    prefix: "info prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 20,
    level: "info",
    prefix: "info prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
];

// should be the same.
const logInfoEventsExpect = logPrefixEventsExpect;

const logEventsExpect = [
  {
    id: 0,
    level: "silly",
    prefix: "silly prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 1,
    level: "verbose",
    prefix: "verbose prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 2,
    level: "info",
    prefix: "info prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 3,
    level: "timing",
    prefix: "timing prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 4,
    level: "http",
    prefix: "http prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 5,
    level: "notice",
    prefix: "notice prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 6,
    level: "warn",
    prefix: "warn prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 7,
    level: "error",
    prefix: "error prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 8,
    level: "silent",
    prefix: "silent prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 9,
    level: "silly",
    prefix: "silly prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 10,
    level: "verbose",
    prefix: "verbose prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 11,
    level: "info",
    prefix: "info prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 12,
    level: "timing",
    prefix: "timing prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 13,
    level: "http",
    prefix: "http prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 14,
    level: "notice",
    prefix: "notice prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 15,
    level: "warn",
    prefix: "warn prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 16,
    level: "error",
    prefix: "error prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 17,
    level: "silent",
    prefix: "silent prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 18,
    level: "silly",
    prefix: "silly prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 19,
    level: "verbose",
    prefix: "verbose prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 20,
    level: "info",
    prefix: "info prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 21,
    level: "timing",
    prefix: "timing prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 22,
    level: "http",
    prefix: "http prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 23,
    level: "notice",
    prefix: "notice prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 24,
    level: "warn",
    prefix: "warn prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 25,
    level: "error",
    prefix: "error prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 26,
    level: "silent",
    prefix: "silent prefix",
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ["x = %j", { foo: { bar: "baz" } }],
  },
  {
    id: 27,
    level: "error",
    prefix: "404",
    message: "This is a longer\nmessage, with some details\nand maybe a stack.\n",
    messageRaw: ["This is a longer\nmessage, with some details\nand maybe a stack.\n"],
  },
  { id: 28, level: "noise", prefix: "", message: "LOUD NOISES", messageRaw: ["LOUD NOISES"] },
  { id: 29, level: "noise", prefix: "error", message: "erroring", messageRaw: ["erroring"] },
];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stream = require("stream").Stream;
const s = new Stream();
s.write = function (m: any) {
  result.push(m);
};

s.writable = true;
s.isTTY = true;
s.end = function () {};

log.stream = s;

log.heading = "npm";

describe("Basic Tests", () => {
  test("Basic log test", () => {
    expect(log.stream).toBe(s);

    log.on("log", logEvents.push.bind(logEvents));
    log.on("log.info", logInfoEvents.push.bind(logInfoEvents));
    log.on("info prefix", logPrefixEvents.push.bind(logPrefixEvents));

    console.error("log.level=silly");
    log.level = "silly";
    log.silly("silly prefix", "x = %j", { foo: { bar: "baz" } });
    log.verbose("verbose prefix", "x = %j", { foo: { bar: "baz" } });
    log.info("info prefix", "x = %j", { foo: { bar: "baz" } });
    log.timing("timing prefix", "x = %j", { foo: { bar: "baz" } });
    log.http("http prefix", "x = %j", { foo: { bar: "baz" } });
    log.notice("notice prefix", "x = %j", { foo: { bar: "baz" } });
    log.warn("warn prefix", "x = %j", { foo: { bar: "baz" } });
    log.error("error prefix", "x = %j", { foo: { bar: "baz" } });
    log.silent("silent prefix", "x = %j", { foo: { bar: "baz" } });

    console.error("log.level=silent");
    log.level = "silent";
    log.silly("silly prefix", "x = %j", { foo: { bar: "baz" } });
    log.verbose("verbose prefix", "x = %j", { foo: { bar: "baz" } });
    log.info("info prefix", "x = %j", { foo: { bar: "baz" } });
    log.timing("timing prefix", "x = %j", { foo: { bar: "baz" } });
    log.http("http prefix", "x = %j", { foo: { bar: "baz" } });
    log.notice("notice prefix", "x = %j", { foo: { bar: "baz" } });
    log.warn("warn prefix", "x = %j", { foo: { bar: "baz" } });
    log.error("error prefix", "x = %j", { foo: { bar: "baz" } });
    log.silent("silent prefix", "x = %j", { foo: { bar: "baz" } });

    console.error("log.level=info");
    log.level = "info";
    log.silly("silly prefix", "x = %j", { foo: { bar: "baz" } });
    log.verbose("verbose prefix", "x = %j", { foo: { bar: "baz" } });
    log.info("info prefix", "x = %j", { foo: { bar: "baz" } });
    log.timing("timing prefix", "x = %j", { foo: { bar: "baz" } });
    log.http("http prefix", "x = %j", { foo: { bar: "baz" } });
    log.notice("notice prefix", "x = %j", { foo: { bar: "baz" } });
    log.warn("warn prefix", "x = %j", { foo: { bar: "baz" } });
    log.error("error prefix", "x = %j", { foo: { bar: "baz" } });
    log.silent("silent prefix", "x = %j", { foo: { bar: "baz" } });
    log.error("404", "This is a longer\n" + "message, with some details\n" + "and maybe a stack.\n");
    log.addLevel("noise", 10000, { beep: true });
    log.noise(false, "LOUD NOISES");
    log.noise("error", "erroring");

    expect(result.join("").trim()).toBe(resultExpect.join("").trim());
    expect(log.record).toEqual(logEventsExpect);
    expect(logEvents).toEqual(logEventsExpect);
    expect(logInfoEvents).toEqual(logInfoEventsExpect);
    expect(logPrefixEvents).toEqual(logPrefixEventsExpect);
  });

  describe("Util Functions", () => {
    let log: Logger;

    beforeEach(() => {
      log = new Logger();
    });

    afterEach(() => {
      log.resume();
      log.gauge.enable();
    });

    test("enableColor", () => {
      log.enableColor();
      expect(log.useColor()).toBe(true);
      expect(log.gauge._theme).toHaveProperty("hasColor", true);
      log.disableColor();
    });

    test("disableColor", () => {
      log.disableColor();
      expect(log.useColor()).toBe(false);
      expect(log.gauge._theme).toHaveProperty("hasColor", false);
    });

    test("enableUnicode", () => {
      log.enableUnicode();
      expect(log.gauge._theme).toHaveProperty("hasUnicode", true);
      log.disableUnicode();
    });

    test("disableUnicode", () => {
      log.disableUnicode();
      expect(log.gauge._theme).toHaveProperty("hasUnicode", false);
    });

    test("themes", () => {
      const _themes = log.gauge._themes;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const themes = require("gauge/lib/themes");
      const newThemes = themes.newThemeSet();
      log.setGaugeThemeset(newThemes);
      expect(log.gauge._themes).toEqual(newThemes);
      log.setGaugeThemeset(_themes);
    });

    test("template", () => {
      const _template = log.gauge._gauge.template;
      const template = [{ type: "progressbar", length: 100 }];
      log.setGaugeTemplate(template);
      expect(log.gauge._gauge.template).toEqual(template);
      log.gauge._gauge.template = _template;
    });

    test("enableProgress while paused", () => {
      log.disableProgress();
      log.pause();
      log.enableProgress();
      expect(log.gauge.isEnabled()).toBe(false);
    });

    test("pause while progressEnabled", () => {
      log.pause();
      expect(log.gauge.isEnabled()).toBe(false);
    });

    test("_buffer while paused", () => {
      log.pause();
      log.log("verbose", "test", "test log");
      expect((log as any)._buffer.length).toBe(1);
      log.resume();
      expect((log as any)._buffer.length).toBe(0);
    });
  });

  describe("log.log", () => {
    // eslint-disable-next-line jest/no-done-callback
    test("emits error on bad loglevel", (done) => {
      log.once("error", (err: { message: any }) => {
        expect(err.message).toMatch(/Undefined log level: "asdf"/);
        done();
      });
      log.log("asdf", "bad loglevel");
    });

    // eslint-disable-next-line jest/no-done-callback
    test("resolves stack traces to a plain string", (done) => {
      log.once("log", (m: { message: any }) => {
        expect(m.message).toMatch("Error: with a stack trace");
        expect(m.message).toMatch("_runTest");
        done();
      });
      const err = new Error("with a stack trace");
      log.log("verbose", "oops", err);
    });

    test("max record size", () => {
      const mrs = log.maxRecordSize;
      log.maxRecordSize = 3;
      log.log("verbose", "test", "log 1");
      log.log("verbose", "test", "log 2");
      log.log("verbose", "test", "log 3");
      log.log("verbose", "test", "log 4");
      expect(log.record.length).toBe(3);
      log.maxRecordSize = mrs;
    });
  });

  describe("write with no stream", () => {
    const gauge = log.gauge;

    afterAll(() => {
      log.gauge = gauge;
      log.stream = s;
    });

    test("should not throw", () => {
      log.gauge = null;
      log.stream = null;
      expect(() => log.write("message")).not.toThrow();
    });
  });

  describe("emitLog to nonexistant level", () => {
    afterEach(() => {
      log.stream = s;
    });

    test("should not throw", () => {
      const badStream = new stream.Writable();
      badStream.on("data", () => {
        throw new Error("should not have gotten data!");
      });
      expect(() => log.emitLog({ prefix: "test", level: "asdf" })).not.toThrow();
    });
  });

  describe("_format with nonexistant stream", () => {
    const gauge = log.gauge;

    afterAll(() => {
      log.gauge = gauge;
      log.stream = s;
    });

    test("should return undefined", () => {
      log.gauge = null;
      log.stream = null;
      expect(log._format("message")).toBeUndefined();
    });
  });

  describe("_format", () => {
    afterAll(() => {
      log.disableColor();
    });

    test("nonexistant stream", () => {
      const gauge = log.gauge;

      log.gauge = null;
      log.stream = null;
      expect(log._format("message")).toBeUndefined();

      // Restore the original gauge and stream
      log.gauge = gauge;
      log.stream = s;
    });

    test("fg", () => {
      log.enableColor();
      const o = log._format("test message", { bg: "blue" });
      expect(o).toMatch("\u001b[44mtest message\u001b[0m");
    });

    test("bg", () => {
      log.enableColor();
      const o = log._format("test message", { bg: "white" });
      expect(o).toMatch("\u001b[47mtest message\u001b[0m");
    });

    test("bold", () => {
      log.enableColor();
      const o = log._format("test message", { bold: true });
      expect(o).toMatch("\u001b[1mtest message\u001b[0m");
    });

    test("underline", () => {
      log.enableColor();
      const o = log._format("test message", { underline: true });
      expect(o).toMatch("\u001b[4mtest message\u001b[0m");
    });

    test("inverse", () => {
      log.enableColor();
      const o = log._format("test message", { inverse: true });
      expect(o).toMatch("\u001b[7mtest message\u001b[0m");
    });
  });
});
