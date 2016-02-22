var chalk = require("chalk");

var colors = {
  info: null, // No color for you
  success: "green",
  warning: "yellow",
  error: "red"
};

var logs = [];

function log(type, message, verbose, error) {
  logs.push({
    type: type,
    message: message,
    error: error
  });

  if (verbose) {
    return;
  }

  if (type && colors[type]) {
    message = chalk[colors[type]](message);
  }

  console.log(message);
}

function getLogs() {
  return logs;
}

function logifyAsync(message, method) {
  return function() {
    log("info", message, true);

    var length = arguments.length;
    var callback = arguments[length - 1];
    var args = Array(length);

    // copy arguments
    for (var i = 0; i < length - 1; i++) {
      args[i] = arguments[i];
    }

    // wrap final callback
    args[length - 1] = function(error) {
      if (error) {
        log("error", message, true);
      } else {
        log("success", message, true);
      }

      callback.apply(null, arguments);
    };

    method.apply(null, args);
  };
}

function logifySync(message, method) {
  return function() {
    log("info", message, true);
    try {
      var result = method.apply(null, arguments);
      log("success", message, true);
      return result;
    } catch (error) {
      log("error", message, true, error);
      throw error;
    }
  };
}

module.exports = {
  log: log,
  getLogs: getLogs,
  logifyAsync: logifyAsync,
  logifySync: logifySync
};
