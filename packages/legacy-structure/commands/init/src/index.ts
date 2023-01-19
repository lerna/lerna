// eslint-disable-next-line @typescript-eslint/no-var-requires
const initIndex = require("lerna/commands/init");

module.exports = initIndex;
module.exports.InitCommand = initIndex.InitCommand;
