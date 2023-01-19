// eslint-disable-next-line @typescript-eslint/no-var-requires
const linkIndex = require("lerna/commands/link");

module.exports = linkIndex;
module.exports.LinkCommand = linkIndex.LinkCommand;
