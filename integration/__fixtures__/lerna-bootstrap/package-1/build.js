"use strict";

const fs = require("fs");
const path = require("path");

const indexSource = path.resolve("./index.src.js");
const indexTarget = path.resolve("./dist/index.js");

fs.mkdirSync(path.dirname(indexTarget));

const reader = fs.createReadStream(indexSource);
const writer = fs.createWriteStream(indexTarget);

// fs.copyFileSync is node >=8.5.0
reader.pipe(writer);
