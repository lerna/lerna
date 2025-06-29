/**
 * Tests ported from the original unmainained strong-log-transformer package here:
 * https://github.com/strongloop/strong-log-transformer/tree/3315d59bc4c912d025e15a6ca22a600a85406f14/test
 */

// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: strong-log-transformer
// This file is licensed under the Apache License 2.0.
// License text available at https://opensource.org/licenses/Apache-2.0

import Logger from "./forked-strong-log-transformer";

describe("strong-log-transformer", () => {
  describe("test-ansi-color-tags.js", () => {
    test("tag object with ansi escape codes", (done) => {
      const slt = Logger({
        tag: {
          blue: "\u001b[1m\u001b[34mblue\u001b[39m\u001b[22m",
          green: "\u001b[32mgreen\u001b[39m",
        },
      });
      const input = ["good line", "good line", "good line"];
      const expected = input
        .map((line) => {
          return (
            "blue:\u001b[1m\u001b[34mblue\u001b[39m\u001b[22m green:\u001b[32mgreen\u001b[39m " + line + "\n"
          );
        })
        .join("");
      let received = "";

      slt.on("data", (buf: any) => {
        if (Buffer.isBuffer(buf)) {
          received += buf.toString("utf8");
        } else if (buf !== null) {
          received += buf;
        }
      });
      slt.on("end", () => {
        expect(received).toBe(expected);
        done();
      });

      input.forEach((line) => {
        slt.write(line + "\n");
      });
      slt.end();
    });
  });

  describe("test-bad-utf8.js", () => {
    test("log line containing bad utf8", (done) => {
      const slt = Logger();
      const input = Buffer.from([0x48, 0x69, 0x20, 0x80, 0x0a]); // "Hi\n"
      const expected = "Hi \ufffd\n"; // replacement character
      let received = "";

      slt.on("data", (buf: any) => {
        if (Buffer.isBuffer(buf)) {
          received += buf.toString("utf8");
        } else if (buf !== null) {
          received += buf;
        }
      });
      slt.on("end", () => {
        expect(received).toBe(expected);
        done();
      });

      slt.write(input);
      slt.end();
    });

    test("chunked bad utf8", (done) => {
      const slt = Logger();
      // Split the bad UTF8 sequence across chunks
      const input1 = Buffer.from([0x48, 0x69, 0x20]); // "Hi "
      const input2 = Buffer.from([0x80, 0x0a]); // bad byte + newline
      const expected = "Hi \ufffd\n";
      let received = "";

      slt.on("data", (buf: any) => {
        if (Buffer.isBuffer(buf)) {
          received += buf.toString("utf8");
        } else if (buf !== null) {
          received += buf;
        }
      });
      slt.on("end", () => {
        expect(received).toBe(expected);
        done();
      });

      slt.write(input1);
      slt.write(input2);
      slt.end();
    });
  });

  describe("test-basic functionality", () => {
    test("basic text transformation", (done) => {
      const slt = Logger();
      const input = "hello world\n";
      const expected = "hello world\n";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        expect(received).toBe(expected);
        done();
      });

      slt.write(input);
      slt.end();
    });

    test("json format", (done) => {
      const slt = Logger({ format: "json" });
      const input = "hello world\n";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        const parsed = JSON.parse(received.replace("\n", ""));
        expect(parsed.msg).toBe("hello world");
        expect(typeof parsed.time).toBe("undefined"); // no timestamp by default
        done();
      });

      slt.write(input);
      slt.end();
    });

    test("json format with timestamp", (done) => {
      const slt = Logger({ format: "json", timeStamp: true });
      const input = "hello world\n";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        const parsed = JSON.parse(received.replace("\n", ""));
        expect(parsed.msg).toBe("hello world");
        expect(typeof parsed.time).toBe("string");
        expect(new Date(parsed.time).getTime()).toBeGreaterThan(0);
        done();
      });

      slt.write(input);
      slt.end();
    });
  });

  describe("test-stringTag functionality", () => {
    test("string tag", (done) => {
      const slt = Logger({ tag: "worker:1" });
      const input = "hello world\n";
      const expected = "worker:1 hello world\n";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        expect(received).toBe(expected);
        done();
      });

      slt.write(input);
      slt.end();
    });
  });

  describe("test-text-tag-object functionality", () => {
    test("object tag", (done) => {
      const slt = Logger({ tag: { worker: "1", pid: "12345" } });
      const input = "hello world\n";
      const expected = "worker:1 pid:12345 hello world\n";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        expect(received).toBe(expected);
        done();
      });

      slt.write(input);
      slt.end();
    });
  });

  describe("test-text-timestamp functionality", () => {
    test("text format with timestamp", (done) => {
      const slt = Logger({ timeStamp: true });
      const input = "hello world\n";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        // Should match: "2023-01-01T00:00:00.000Z hello world\n"
        const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z hello world\n$/;
        expect(received).toMatch(timestampRegex);
        done();
      });

      slt.write(input);
      slt.end();
    });

    test("text format with timestamp and tag", (done) => {
      const slt = Logger({ timeStamp: true, tag: "worker:1" });
      const input = "hello world\n";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        // Should match: "2023-01-01T00:00:00.000Z worker:1 hello world\n"
        const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z worker:1 hello world\n$/;
        expect(received).toMatch(timestampRegex);
        done();
      });

      slt.write(input);
      slt.end();
    });
  });

  describe("test-lineMerge functionality", () => {
    test("merge multiline logs", (done) => {
      const slt = Logger({ mergeMultiline: true });
      const input =
        "Error: something bad happened\n    at Object.<anonymous> (/path/to/file.js:1:1)\n    at Module._compile (module.js:456:26)\nnext line\n";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        const lines = received.split("\n").filter((line) => line.length > 0);
        expect(lines).toHaveLength(2);
        expect(lines[0]).toContain("Error: something bad happened");
        expect(lines[0]).toContain("at Object.<anonymous>");
        expect(lines[0]).toContain("at Module._compile");
        expect(lines[1]).toBe("next line");
        done();
      });

      slt.write(input);
      slt.end();
    });

    test("merge multiline with timeout", (done) => {
      const slt = Logger({ mergeMultiline: true });
      let received = "";
      let dataCount = 0;

      slt.on("data", (buf: any) => {
        received += buf.toString();
        dataCount++;
      });
      slt.on("end", () => {
        expect(dataCount).toBeGreaterThan(0);
        done();
      });

      slt.write("Error: something bad\n");
      slt.write("    at some location\n");

      // Wait for the timeout to trigger flush
      setTimeout(() => {
        slt.end();
      }, 15);
    });
  });

  describe("newline handling", () => {
    test("handles different line endings", (done) => {
      const slt = Logger();
      const inputs = ["line1\n", "line2\r\n", "line3\r", "line4\v", "line5\f"];
      let received = "";
      let lineCount = 0;

      slt.on("data", (buf: any) => {
        received += buf.toString();
        lineCount++;
      });
      slt.on("end", () => {
        expect(lineCount).toBe(5);
        expect(received).toContain("line1\n");
        expect(received).toContain("line2\n");
        expect(received).toContain("line3\n");
        expect(received).toContain("line4\n");
        expect(received).toContain("line5\n");
        done();
      });

      inputs.forEach((input) => slt.write(input));
      slt.end();
    });

    test("swallows empty lines", (done) => {
      const slt = Logger();
      const input = "line1\n\n\nline2\n";
      let received = "";
      let lineCount = 0;

      slt.on("data", (buf: any) => {
        received += buf.toString();
        lineCount++;
      });
      slt.on("end", () => {
        expect(lineCount).toBe(2); // Only non-empty lines
        expect(received).toBe("line1\nline2\n");
        done();
      });

      slt.write(input);
      slt.end();
    });
  });

  describe("edge cases", () => {
    test("handles newlines in log messages correctly", (done) => {
      const slt = Logger();
      const input = "line with\nnewline in it\n";
      let received = "";
      let lineCount = 0;

      slt.on("data", (buf: any) => {
        received += buf.toString();
        lineCount++;
      });
      slt.on("end", () => {
        // Input with newlines gets split into separate lines by deLiner
        expect(lineCount).toBe(2);
        expect(received).toBe("line with\nnewline in it\n");
        done();
      });

      slt.write(input);
      slt.end();
    });

    test("handles incomplete lines at end of stream", (done) => {
      const slt = Logger();
      const input = "incomplete line without newline";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        expect(received).toBe("incomplete line without newline\n");
        done();
      });

      slt.write(input);
      slt.end();
    });

    test("handles multiple chunks forming single line", (done) => {
      const slt = Logger();
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        expect(received).toBe("hello world\n");
        done();
      });

      slt.write("hello ");
      slt.write("world\n");
      slt.end();
    });

    test("handles tag with special characters", (done) => {
      const slt = Logger({ tag: "worker[1]" });
      const input = "test message\n";
      let received = "";

      slt.on("data", (buf: any) => {
        received += buf.toString();
      });
      slt.on("end", () => {
        expect(received).toBe("worker[1] test message\n");
        done();
      });

      slt.write(input);
      slt.end();
    });
  });

  describe("Logger.DEFAULTS", () => {
    test("has correct default values", () => {
      expect(Logger.DEFAULTS).toEqual({
        format: "text",
        tag: "",
        mergeMultiline: false,
        timeStamp: false,
      });
    });

    test("does not mutate defaults when creating logger", () => {
      const originalDefaults = { ...Logger.DEFAULTS };
      Logger({ format: "json", tag: "test" });
      expect(Logger.DEFAULTS).toEqual(originalDefaults);
    });
  });
});
