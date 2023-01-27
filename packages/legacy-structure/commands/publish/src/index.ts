// eslint-disable-next-line @typescript-eslint/no-var-requires
const index = require("lerna/commands/publish");

module.exports = index;
module.exports.PublishCommand = index.PublishCommand;
