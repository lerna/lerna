"use strict";

const Command = require("@lerna/command");
const output = require("@lerna/output");
const envinfo = require("envinfo");

module.exports = factory;

function factory(argv) {
  return new InfoCommand(argv);
}

class InfoCommand extends Command {
  execute() {
    output("\n Environment info:");
    const info = await envinfo.run({
      System: ["OS", "CPU"],
      Binaries: ["Node", "Yarn", "npm"],
      Utilities: ["Git"],
      npmPackages: ["lerna"],
    });
    output(info);
  }
}

module.exports.InfoCommand = InfoCommand;
