"use strict";

const fs = require("fs");
const path = require("path");

fs.writeFileSync(path.resolve("index.js"), "module.exports = 'C';");
