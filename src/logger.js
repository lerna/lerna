import progressBar from "./progressBar";
import chalk from "chalk";
import pad from "pad";

const cwd = process.cwd();

const DEFAULT_LOGLEVEL = "info";

const LEVELS = [
  [ "silly",   "purple" ],
  [ "verbose", "blue"   ],
  [ "info",    "white"  ],
  [ "success", "green"  ],
  [ "warn",    "yellow" ],
  [ "error",   "red"    ],
  [ "silent",           ],
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
    if (process.env.NODE_ENV !== "test") {
      console.log(message);
    }
  }

  newLine() {
    this._emit("");
  }

  logifyAsync(target, property, descriptor) {
    const message = target.name + "." + property;
    const method = descriptor.value;

    return (...args) => {
      const callback = args.pop();
      const msg = this._formatMethod(message, args);

      this.info(msg, true);

      // wrap final callback
      args.push((error, value) => {
        if (error) {
          this.error(msg, true);
        } else {
          this.success(msg + " => " + this._formatValue(value), true);
        }

        callback(error, value);
      });

      method(...args);
    };
  }

  logifySync(target, property, descriptor) {
    const message = target.name + "." + property;
    const method = descriptor.value;

    return (...args) => {
      const msg = this._formatMethod(message, args);

      this.info(msg, true);

      try {
        const result = method(...args);
        this.success(msg + " => " + this._formatValue(result), true);
        return result;
      } catch (error) {
        this.error(msg, error, true);
        throw error;
      }
    };
  }

  _formatMethod(method, args) {
    return pad(method, 30, " ") + "(" + this._formatArguments(args) + ")";
  }

  _formatArguments(args) {
    return args.map(this._formatValue).join(", ");
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
