var logger = require("./logger");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var fs     = require("fs");

exports.mkdirSync = logger.logifySync("fsUtils.mkdirSync", fs.mkdirSync);
exports.mkdirp = logger.logifyAsync("fsUtils.mkdirp", mkdirp);
exports.readdirSync = logger.logifySync("fsUtils.readdirSync", fs.readdirSync);
exports.existsSync = logger.logifySync("fsUtils.existsSync", fs.existsSync);
exports.writeFile = logger.logifyAsync("fsUtils.writeFile", fs.writeFile);
exports.writeFileSync = logger.logifySync("fsUtils.writeFileSync", fs.writeFileSync);
exports.readFileSync = logger.logifySync("fsUtils.readFileSync", fs.readFileSync);
exports.rimraf = logger.logifyAsync("fsUtils.rimraf", rimraf);
