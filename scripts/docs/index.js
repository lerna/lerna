const path = require("path");
const markdownMagic = require("markdown-magic");
const install = require("markdown-magic-install-command");
const template = require("markdown-magic-template");

const paths = [
  `${path.resolve(__dirname, "../..")}/**.md`,
  "!node_modules",
];

const config = {
  transforms: {
    INSTALLCMD: install,
    TEMPLATE: template(require("../../package.json")),
  },
};

markdownMagic(paths, config);
