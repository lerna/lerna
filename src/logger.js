import progressBar from "./progressBar";
import chalk from "chalk";
import pad from "pad";

const cwd = process.cwd();

class Logger {
  constructor() {
    this.logs = [];
  }

  _log(type, verbose, style, message, error) {
    this.logs.push({
      type,
      message,
      error
    });

    if (verbose) {
      return;
    }

    if (error) {
      message += "\n" + (error.stack || error);
    }

    if (style) {
      message = style(message);
    }

    progressBar.clear();
    if (process.env.NODE_ENV !== "test") {
      console.log(message);
    }
    progressBar.restore();
  }

  debug(message, verbose = true) {
    this._log("debug", verbose, chalk.blue, message);
  }

  info(message, verbose = false) {
    this._log("info", verbose, chalk.white, message);
  }

  success(message, verbose = false) {
    this._log("success", verbose, chalk.green, message);
  }

  warning(message, verbose = false) {
    this._log("warning", verbose, chalk.yellow, message);
  }

  error(message, error, verbose = false) {
    this._log("error", verbose, chalk.red, message, error);
  }

  newLine() {
    this.info("");
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

export default new Logger();
