var fsUtils = require("./fsUtils");
var logger  = require("./logger");
var path    = require("path");
var pad     = require("pad")

function formatType(type) {
  return pad("lerna(" + type + ")", 15, " ");
}

var errorsSeen = [];

function formatError(error) {
  var message = [];
  var hasSeen = errorsSeen.indexOf(error) > -1;

  if (!error) {
    return "";
  }

  if (!hasSeen) {
    errorsSeen.push(error);
    if (error.message) message.push(error.message);
    if (error.stack) message.push(error.stack);
    if (!message.length) message.push(error);
  }

  message = message.join("\n").split("\n").map(function(line) {
    return "  " + line;
  }).join("\n");

  return "\n" + message;
}

function formatLog(log) {
  return formatType(log.type) + log.message + formatError(log.error);
}

module.exports = function exit(code) {
  if (!code || code === 0) {
    process.exit(0);
  }

  var filePath = path.join(process.cwd(), "lerna-debug.log");
  var fileContent = logger.getLogs().map(formatLog).join("\n");

  fsUtils.writeFileSync(filePath, fileContent);

  process.exit(code);
};
