/* eslint-disable */
// @ts-nocheck

/**
 * Internal fork of the unmaintained strong-log-transformer package.
 * https://github.com/strongloop/strong-log-transformer/blob/3315d59bc4c912d025e15a6ca22a600a85406f14/lib/logger.js
 *
 * Notable changes:
 * - replaced the dependency on duplexer, which has been deprecated for a long time, with inline createDuplex()
 * - modernized core node.js imports and removed the usage of deprecated node:util._extend()
 */

// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: strong-log-transformer
// This file is licensed under the Apache License 2.0.
// License text available at https://opensource.org/licenses/Apache-2.0

import stream from "node:stream";
import { StringDecoder } from "node:string_decoder";
import util from "node:util";

export default Logger;

Logger.DEFAULTS = {
  format: "text",
  tag: "",
  mergeMultiline: false,
  timeStamp: false,
};

var formatters = {
  text: textFormatter,
  json: jsonFormatter,
};

function Logger(options?) {
  var defaults = JSON.parse(JSON.stringify(Logger.DEFAULTS));
  options = Object.assign(defaults, options || {});
  var catcher = deLiner();
  var emitter = catcher;
  var transforms = [objectifier()];

  if (options.tag) {
    transforms.push(staticTagger(options.tag));
  }

  if (options.mergeMultiline) {
    transforms.push(lineMerger());
  }

  // TODO
  // if (options.pidStamp) {
  //   transforms.push(pidStamper(options.pid));
  // }

  // TODO
  // if (options.workerStamp) {
  //   transforms.push(workerStamper(options.worker));
  // }

  transforms.push(formatters[options.format](options));

  // restore line endings that were removed by line splitting
  transforms.push(reLiner());

  for (var t in transforms) {
    emitter = emitter.pipe(transforms[t]);
  }

  return createDuplex(catcher, emitter);
}

function deLiner() {
  var decoder = new StringDecoder("utf8");
  var last = "";

  return new stream.Transform({
    transform(chunk, _enc, callback) {
      last += decoder.write(chunk);
      var list = last.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/g);
      last = list.pop();
      for (var i = 0; i < list.length; i++) {
        // swallow empty lines
        if (list[i]) {
          this.push(list[i]);
        }
      }
      callback();
    },
    flush(callback) {
      // incomplete UTF8 sequences become UTF8 replacement characters
      last += decoder.end();
      if (last) {
        this.push(last);
      }
      callback();
    },
  });
}

function reLiner() {
  return new stream.Transform({
    objectMode: true,
    transform(chunk, _encoding, callback) {
      this.push(chunk + "\n");
      callback();
    },
  });
}

function objectifier() {
  return new stream.Transform({
    objectMode: true,
    autoDestroy: false,
    transform(chunk, _encoding, callback) {
      this.push({
        msg: chunk,
        time: Date.now(),
      });
      callback();
    },
  });
}

function staticTagger(tag) {
  return new stream.Transform({
    objectMode: true,
    transform(logEvent, _encoding, callback) {
      logEvent.tag = tag;
      this.push(logEvent);
      callback();
    },
  });
}

function textFormatter(options) {
  return new stream.Transform({
    objectMode: true,
    transform(logEvent, _encoding, callback) {
      var line = util.format("%s%s", textifyTags(logEvent.tag), logEvent.msg.toString());
      if (options.timeStamp) {
        line = util.format("%s %s", new Date(logEvent.time).toISOString(), line);
      }
      this.push(line.replace(/\n/g, "\\n"));
      callback();
    },
  });

  function textifyTags(tags) {
    var str = "";
    if (typeof tags === "string") {
      str = tags + " ";
    } else if (typeof tags === "object") {
      for (var t in tags) {
        str += t + ":" + tags[t] + " ";
      }
    }
    return str;
  }
}

function jsonFormatter(options) {
  return new stream.Transform({
    objectMode: true,
    transform(logEvent, _encoding, callback) {
      if (options.timeStamp) {
        logEvent.time = new Date(logEvent.time).toISOString();
      } else {
        delete logEvent.time;
      }
      logEvent.msg = logEvent.msg.toString();
      this.push(JSON.stringify(logEvent));
      callback();
    },
  });
}

function lineMerger() {
  var previousLine = null;
  var flushTimer = null;

  var t = new stream.Transform({
    objectMode: true,
    transform(line, _encoding, callback) {
      if (/^\s+/.test(line.msg)) {
        if (previousLine) {
          previousLine.msg += "\n" + line.msg;
        } else {
          previousLine = line;
        }
      } else {
        flushPrevious.call(this);
        previousLine = line;
      }
      // rolling timeout
      clearTimeout(flushTimer);
      flushTimer = setTimeout(flushPrevious.bind(this), 10);
      callback();
    },
    flush(callback) {
      flushPrevious.call(this);
      callback();
    },
  });

  return t;

  function flushPrevious() {
    if (previousLine) {
      this.push(previousLine);
      previousLine = null;
    }
  }
}

/**
 * Net new function in internal fork to replace duplexer
 */

function createDuplex(input: stream.Readable, output: stream.Writable) {
  const duplex = new stream.Duplex({
    objectMode: false,
    allowHalfOpen: false,
  });
  // Forward writes to the input stream
  duplex._write = (chunk, encoding, cb) => {
    input.write(chunk, encoding, cb);
  };
  // Forward reads from the output stream
  duplex._read = () => {
    // This will be handled by the output stream's data events
  };
  // Handle end of writing
  duplex._final = (cb) => {
    input.end(cb);
  };
  // Pipe output stream data to our duplex stream
  output.on("data", (chunk) => {
    duplex.push(chunk);
  });
  output.on("end", () => {
    duplex.push(null); // Signal end of stream
  });
  // Forward errors
  input.on("error", (err) => {
    duplex.emit("error", err);
  });
  output.on("error", (err) => {
    duplex.emit("error", err);
  });
  return duplex;
}
