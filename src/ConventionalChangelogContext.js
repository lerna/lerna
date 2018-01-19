"use strict";

const Repository = require("./Repository");

const repository = new Repository(process.cwd());

module.exports = {
  version: repository.version,
};
