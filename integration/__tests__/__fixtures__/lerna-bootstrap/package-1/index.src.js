"use strict";

let msg;

try {
  require("pify");
  msg = "OK";
} catch (ex) {
  console.error(ex);
  msg = "FAIL";
}

module.exports = msg;
