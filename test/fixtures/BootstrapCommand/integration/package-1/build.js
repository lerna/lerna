"use strict";

const fs = require("fs");
const path = require("path");

const indexSource = path.resolve("./index.src.js");
const indexTarget = path.resolve("./index.js");

fs.copyFileSync(indexSource, indexTarget);
