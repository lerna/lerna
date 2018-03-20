"use strict";

const path = require("path");
const Conf = require("./conf");
const defaults = require("./defaults");
const toNerfDart = require("./nerf-dart");

module.exports = npmConf;
module.exports.Conf = Conf;
module.exports.defaults = Object.assign({}, defaults.defaults);
module.exports.toNerfDart = toNerfDart;

// https://github.com/npm/npm/blob/latest/lib/config/core.js#L101-L200
function npmConf(opts) {
  const conf = new Conf(Object.assign({}, defaults.defaults));

  conf.add(Object.assign({}, opts), "cli");
  conf.addEnv();
  conf.loadPrefix();

  const projectConf = path.resolve(conf.localPrefix, ".npmrc");
  const userConf = conf.get("userconfig");

  if (!conf.get("global") && projectConf !== userConf) {
    conf.addFile(projectConf, "project");
  } else {
    conf.add({}, "project");
  }

  conf.addFile(conf.get("userconfig"), "user");

  if (conf.get("prefix")) {
    const etc = path.resolve(conf.get("prefix"), "etc");
    conf.root.globalconfig = path.resolve(etc, "npmrc");
    conf.root.globalignorefile = path.resolve(etc, "npmignore");
  }

  conf.addFile(conf.get("globalconfig"), "global");
  conf.loadUser();

  const caFile = conf.get("cafile");

  if (caFile) {
    conf.loadCAFile(caFile);
  }

  return conf;
}
