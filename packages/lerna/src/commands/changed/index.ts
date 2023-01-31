// eslint-disable-next-line @typescript-eslint/no-var-requires
const changedIndex = require("@lerna/commands/changed");

module.exports = changedIndex;
module.exports.ChangedCommand = changedIndex.ChangedCommand;
