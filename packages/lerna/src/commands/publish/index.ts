// eslint-disable-next-line @typescript-eslint/no-var-requires
const publishIndex = require("@lerna/commands/publish");

module.exports = publishIndex;
module.exports.PublishCommand = publishIndex.PublishCommand;
