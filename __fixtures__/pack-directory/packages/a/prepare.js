"use strict";

const fs = require("fs");
const path = require("path");

const sourceIndex = path.resolve("./src/index.js");
const targetIndex = path.resolve("./dist/index.js");

fs.mkdirSync(path.dirname(targetIndex));

const reader = fs.createReadStream(sourceIndex);
const writer = fs.createWriteStream(targetIndex);

// fs.copyFileSync is node >=8.5.0
reader.pipe(writer);
