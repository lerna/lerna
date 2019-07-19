"use strict";

const Command = require("@lerna/command");
const output = require("@lerna/output");
const envinfo = require("envinfo");

module.exports = factory;

function factory(argv) {
  return new InfoCommand(argv);
}

class InfoCommand extends Command {
  initialize() {}
  
  execute() {
    output("\n Environment info:");
    envinfo.run({
      System: ["OS", "CPU"],
      Binaries: ["Node", "Yarn", "npm"],
      Utilities: ["Git"],
      npmPackages: ["lerna"],
    })
    .then(output);
  }
}

module.exports.InfoCommand = InfoCommand;
