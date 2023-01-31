// eslint-disable-next-line @typescript-eslint/no-var-requires
const importIndex = require("lerna/commands/import");

module.exports = importIndex;
module.exports.ImportCommand = importIndex.ImportCommand;
