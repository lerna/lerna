"use strict";

const log = require("npmlog");

class ValidationError extends Error {
  constructor(prefix, message, ...rest) {
    super(message);
    this.name = "ValidationError";
    this.prefix = prefix;
    log.resume(); // might be paused, noop otherwise
    log.error(prefix, message, ...rest);
  }
}

module.exports.ValidationError = ValidationError;
