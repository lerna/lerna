// eslint-disable-next-line @typescript-eslint/no-var-requires
const versionIndex = require("@lerna/commands/version");

module.exports = versionIndex;
module.exports.VersionCommand = versionIndex.VersionCommand;
