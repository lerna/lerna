import progressBar from "./progressBar";
import chalk from "chalk";
import pad from "pad";

const cwd = process.cwd();

const DEFAULT_LOGLEVEL = "info";

const LEVELS = [
  [ "silly",   "magenta" ],
  [ "verbose", "blue"    ],
  [ "info",    "reset"   ],
  [ "success", "green"   ],
  [ "warn",    "yellow"  ],
  [ "error",   "red"     ],
  [ "silent",            ],
];

const TYPE_TO_LEVEL = LEVELS
  .reduce((map, [type], index) => (map[type] = index, map), {});

class Logger {
  constructor() {
    this.setLogLevel();
    this.logs = [];
  }

  setLogLevel(type) {
    this.loglevel = TYPE_TO_LEVEL[type || DEFAULT_LOGLEVEL];
  }

  _log(type, style, level, message, error) {
    this.logs.push({
      type,
      message,
      error
    });

    if (level < this.loglevel) {
      return;
    }

    if (error) {
      message += "\n" + (error.stack || error);
    }

    if (style) {
      message = style(message);
    }

    progressBar.clear();
    this._emit(message);
    progressBar.restore();
  }

  _emit(message) {
    if (process.env.NODE_ENV !== "lerna-test") {
      console.log(message);
    }
  }

  newLine() {
    this._emit("");
  }

  logifyAsync() {
    return (target, property, descriptor) => {
      const message = target.name + "." + property;
      const method = descriptor.value;

      descriptor.value = (...args) => {
        const callback = args.pop();
        const msg = this._formatMethod(message, args);

        this.verbose(msg);

        // wrap final callback
        args.push((error, value) => {
          if (error) {
            this.error(msg, error);
          } else {
            this.verbose(msg + " => " + this._formatValue(value));
          }

          callback(error, value);
        });

        method(...args);
      };
    };
  }

  logifySync() {
    return (target, property, descriptor) => {
      const message = target.name + "." + property;
      const method = descriptor.value;

      descriptor.value = (...args) => {
        const msg = this._formatMethod(message, args);

        this.verbose(msg);

        try {
          const result = method(...args);
          this.verbose(msg + " => " + this._formatValue(result));
          return result;
        } catch (error) {
          this.error(msg, error);
          throw error;
        }
      };
    };
  }

  _formatMethod(method, args) {
    return pad(method, 30, " ") + "(" + this._formatArguments(args) + ")";
  }

  _formatArguments(args) {
    const fullArgs = args.map(this._formatValue).join(", ");
    if (fullArgs.length > 100) {
      return fullArgs.slice(0, 100) + "...";
    } else {
      return fullArgs;
    }
  }

  _formatValue(arg) {
    if (typeof arg === "function") {
      return "function " + arg.name + "() {...}";
    }

    return (JSON.stringify(arg) || "").replace(cwd, ".");
  }
}

LEVELS.forEach(([type, color]) => {
  if (!color) return; // "silent"
  const style = chalk[color];
  const level = TYPE_TO_LEVEL[type];
  Logger.prototype[type] = function(message, error) {
    this._log(type, style, level, message, error);
  };
});

export default new Logger();
