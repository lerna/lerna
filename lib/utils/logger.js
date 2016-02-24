var progressBar = require("./progressBar");
var chalk       = require("chalk");
var pad         = require("pad");


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

  progressBar.clear();
  console.log(message);
  progressBar.restore();
}

function getLogs() {
  return logs;
}

var cwd = process.cwd();

function formatArg(arg) {
  if (typeof arg === "function") {
    return "function " + arg.name + "() {...}";
  }

  return (JSON.stringify(arg) || "").replace(cwd, ".");
}

function formatArgs(args) {
  return args.map(formatArg).join(", ");
}

function formatMethod(method, args) {
  return pad(method, 30, " ") + "(" + formatArgs(args) + ")";
}

// I'm sorry that the below code is kinda gross.

function logifyAsync(message, method) {
  return function() {
    var length = arguments.length;
    var callback = arguments[length - 1];
    var args = Array(length);

    // copy arguments
    for (var i = 0; i < length; i++) {
      args[i] = arguments[i];
    }

    message = formatMethod(message, args);

    log("info", message, true);

    // wrap final callback
    args[length - 1] = function(error, value) {
      if (error) {
        log("error", message, true);
      } else {
        log("success", message + " => " + formatArg(value), true);
      }

      callback.apply(null, arguments);
    };

    method.apply(null, args);
  };
}

function logifySync(message, method) {
  return function() {
    var length = arguments.length;
    var args = Array(length);
    // copy arguments
    for (var i = 0; i < length; i++) {
      args[i] = arguments[i];
    }

    message = formatMethod(message, args);

    log("info", message, true);

    try {
      var result = method.apply(null, args);
      log("success", message + " => " + formatArg(result), true);
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
