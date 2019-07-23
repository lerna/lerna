"use strict";

const fs = require("fs");
const path = require("path");

const distDir = path.resolve("dist");
const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));

delete pkg.private;
delete pkg.scripts;
delete pkg.publishConfig;

pkg.description = "big important things to do";
pkg.main = "prepacked.js";

fs.mkdirSync(distDir);
fs.writeFileSync(path.join(distDir, "package.json"), JSON.stringify(pkg, null, 2));
fs.writeFileSync(path.join(distDir, "prepacked.js"), "module.exports = 'B';");
