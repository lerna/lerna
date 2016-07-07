// @flow

import progressBar from "./progressBar";
import chalk from "chalk";
import pad from "pad";

type Descriptor = {
  configurable: boolean,
  enumerable: boolean,
  value: Function,
  writable: boolean,
  get: ?() => mixed,
  set: ?(newValue: mixed) => mixed
};

const cwd = process.cwd();

const LEVELS = {
  silly   : 0,
  verbose : 1,
  info    : 2,
  success : 3,
  warn    : 4,
  error   : 5,
  silent  : 6
};

export type Levels = $Keys<typeof LEVELS>;

const LEVELS_TO_STYLES: { [level: Levels]: string | null } = {
  silly   : "magenta",
  verbose : "blue",
  info    : "reset",
  success : "green",
  warn    : "yellow",
  error   : "red",
  silent  : null
};

const DEFAULT_LOGLEVEL: Levels = "info";

export type Log = {
  type: Levels,
  message: string,
  error: ?Error
};

class Logger {
  logs: Array<Object>;
  logLevel: number;

  constructor() {
    this.setLogLevel(DEFAULT_LOGLEVEL);
    this.logs = [];
  }

  setLogLevel(type: Levels) {
    this.logLevel = LEVELS[type];
  }

  _log(type: Levels, message: string, error: ?Error) {
    let level = LEVELS[type];
    let style = LEVELS_TO_STYLES[type];

    this.logs.push({
      type,
      message,
      error
    });

    if (level < this.logLevel) {
      return;
    }

    if (error) {
      message += "\n" + (error.stack || error.message);
    }

    if (style && chalk[style]) {
      message = chalk[style](message);
    }

    progressBar.clear();
    this._emit(message);
    progressBar.restore();
  }

  _emit(message: string) {
    if (process.env.NODE_ENV !== "test") {
      console.log(message);
    }
  }

  newLine() {
    this._emit("");
  }

  logifyAsync() {
    return (target: Function, property: string, descriptor: Descriptor) => {
      const message = target.name + "." + property;
      const method = descriptor.value;

      descriptor.value = (...args) => {
        const callback: any = args.pop();
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
    return (target: Function, property: string, descriptor: Descriptor) => {
      const message = target.name + "." + property;
      const method: Function = descriptor.value;

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

  _formatMethod(method: string, args: Array<mixed>) {
    return pad(method, 30, " ") + "(" + this._formatArguments(args) + ")";
  }

  _formatArguments(args: Array<mixed>) {
    const fullArgs = args.map(this._formatValue).join(", ");
    if (fullArgs.length > 100) {
      return fullArgs.slice(0, 100) + "...";
    } else {
      return fullArgs;
    }
  }

  _formatValue(arg: mixed) {
    if (typeof arg === "function") {
      return "function " + arg.name + "() {...}";
    }

    return (JSON.stringify(arg) || "").replace(cwd, ".");
  }

  silly(message: string, error: ?Error) {
    this._log('silly', message, error);
  }

  verbose(message: string, error: ?Error) {
    this._log('verbose', message, error);
  }

  info(message: string, error: ?Error) {
    this._log('info', message, error);
  }

  success(message: string, error: ?Error) {
    this._log('success', message, error);
  }

  warn(message: string, error: ?Error) {
    this._log('warn', message, error);
  }

  error(message: string, error: ?Error) {
    this._log('error', message, error);
  }

  silent(message: string, error: ?Error) {
    this._log('silent', message, error);
  }
}

export default new Logger();
