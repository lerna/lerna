"use strict";

const log = require("npmlog");
const figgyPudding = require("figgy-pudding");

module.exports = figgyPudding(
  {
    "fetch-retries": {},
    fetchRetries: "fetch-retries",
    log: { default: log },
    registry: {},
    username: {},
  },
  {
    other() {
      // open it up for the sake of tests
      return true;
    },
  }
);
