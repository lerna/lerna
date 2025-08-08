import { CommandConfigOptions, Logger, Project, ValidationError, log } from "@lerna/core";
import dedent from "dedent";
import execa from "execa";
import os from "os";
import { PackageGraph } from "../package-graph";
import { writeLogFile } from "../write-log-file";
import { cleanStack } from "./clean-stack";
import { defaultOptions } from "./default-options";
import { logPackageError } from "./log-package-error";
import { warnIfHanging } from "./warn-if-hanging";

const DEFAULT_CONCURRENCY = os.cpus().length;

export class Command<T extends CommandConfigOptions = CommandConfigOptions> {
  name: string;
  composed: boolean;
  options: T = {} as T;
  runner: Promise<unknown>;
  concurrency?: number;
  toposort = false;
  execOpts?: { cwd: string; maxBuffer?: number };
  packageGraph?: PackageGraph;
  logger!: Logger;

  private _project?: Project;
  get project(): Project {
    if (this._project === undefined) {
      throw new ValidationError("ENOPROJECT", "Lerna Project not initialized!");
    }
    return this._project;
  }

  set project(project: Project) {
    this._project = project;
  }

  constructor(readonly _argv: any, { skipValidations } = { skipValidations: false }) {
    log.pause();
    log.heading = "lerna";

    const argv = { ..._argv };
    log.silly("argv", argv);

    // "FooCommand" => "foo"
    this.name = this.constructor.name.replace(/Command$/, "").toLowerCase();

    // composed commands are called from other commands, like publish -> version
    this.composed = typeof argv.composed === "string" && argv.composed !== this.name;

    if (!this.composed) {
      // composed commands have already logged the lerna version
      log.notice("cli", `v${argv.lernaVersion}`);
    }

    // launch the command
    let runner = new Promise((resolve, reject) => {
      // run everything inside a Promise chain
      let chain = Promise.resolve();

      chain = chain.then(() => {
        this.project = new Project(argv.cwd);
      });
      chain = chain.then(() => this.configureEnvironment());
      chain = chain.then(() => this.configureOptions());
      chain = chain.then(() => this.configureProperties());
      chain = chain.then(() => this.configureLogging());
      // For the special "repair" command we want to initialize everything but don't want to run validations as that will end up becoming cyclical
      if (!skipValidations) {
        chain = chain.then(() => this.runValidations());
      }
      chain = chain.then(() => this.runPreparations());
      chain = chain.then(() => this.runCommand());

      chain.then(
        (result) => {
          warnIfHanging();

          resolve(result);
        },
        (err) => {
          if (err.pkg) {
            // Cleanly log specific package error details
            logPackageError(err, this.options.stream);
          } else if (err.name !== "ValidationError") {
            // npmlog does some funny stuff to the stack by default,
            // so pass it directly to avoid duplication.
            log.error("", cleanStack(err, this.constructor.name));
          }

          // ValidationError does not trigger a log dump, nor do external package errors
          if (err.name !== "ValidationError" && !err.pkg) {
            writeLogFile(this.project.rootPath);
          }

          warnIfHanging();

          // error code is handled by cli.fail()
          reject(err);
        }
      );
    });

    // passed via yargs context in tests, never actual CLI
    /* istanbul ignore else */
    if (argv.onResolved || argv.onRejected) {
      runner = runner.then(argv.onResolved, argv.onRejected);

      // when nested, never resolve inner with outer callbacks
      delete argv.onResolved;
      delete argv.onRejected;
    }

    // "hide" irrelevant argv keys from options
    for (const key of ["cwd", "$0"]) {
      Object.defineProperty(argv, key, { enumerable: false });
    }

    Object.defineProperty(this, "argv", {
      value: Object.freeze(argv),
    });

    this.runner = runner;
  }

  // proxy "Promise" methods to "private" instance
  then(onResolved: () => void, onRejected: (err: string | Error) => void) {
    return this.runner.then(onResolved, onRejected);
  }

  /* istanbul ignore next */
  catch(onRejected: (err: string | Error) => void) {
    return this.runner.catch(onRejected);
  }

  get requiresGit() {
    return true;
  }

  // Override this to inherit config from another command.
  // For example `changed` inherits config from `publish`.
  get otherCommandConfigs() {
    return [];
  }

  configureEnvironment() {
    const ci = require("is-ci");
    let loglevel;
    let progress;

    /* istanbul ignore next */
    if (ci || !process.stderr.isTTY) {
      log.disableColor();
      progress = false;
    } else if (!process.stdout.isTTY) {
      // stdout is being piped, don't log non-errors or progress bars
      progress = false;
      loglevel = "error";
    } else if (process.stderr.isTTY) {
      log.enableColor();
      log.enableUnicode();
    }

    Object.defineProperty(this, "envDefaults", {
      value: {
        ci,
        progress,
        loglevel,
      },
    });
  }

  configureOptions() {
    // Command config object normalized to "command" namespace
    const commandConfig = this.project.config.command || {};

    // The current command always overrides otherCommandConfigs
    const overrides = [this.name, ...this.otherCommandConfigs].map((key) => commandConfig[key]);

    this.options = defaultOptions(
      // CLI flags, which if defined overrule subsequent values
      this.argv,
      // Namespaced command options from `lerna.json`
      ...overrides,
      // Global options from `lerna.json`
      this.project.config,
      // Environmental defaults prepared in previous step
      this.envDefaults
    );

    if (this.options.verbose && this.options.loglevel !== "silly") {
      this.options.loglevel = "verbose";
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  argv(argv: any, arg1: any, config: any, envDefaults: any): any {
    throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  envDefaults(argv: any, arg1: any, config: any, envDefaults: any): any {
    throw new Error("Method not implemented.");
  }

  configureProperties() {
    const { concurrency = 0, sort, maxBuffer } = this.options;
    this.concurrency = Math.max(1, +concurrency || DEFAULT_CONCURRENCY);
    this.toposort = sort === undefined || sort;

    /** @type {import("@lerna/child-process").ExecOpts} */
    this.execOpts = {
      cwd: this.project.rootPath,
      maxBuffer,
    };
  }

  configureLogging() {
    const { loglevel } = this.options;

    if (loglevel) {
      log.level = loglevel;
    }

    // handle log.success()
    log.addLevel("success", 3001, { fg: "green", bold: true });

    // create logger that subclasses use
    Object.defineProperty(this, "logger", {
      value: log["newGroup"](this.name),
    });

    // emit all buffered logs at configured level and higher
    log.resume();
  }

  enableProgressBar() {
    /* istanbul ignore next */
    if (this.options.progress !== false) {
      log.enableProgress();
    }
  }

  gitInitialized() {
    const opts: execa.SyncOptions = {
      cwd: this.project.rootPath,
      // don't throw, just want boolean
      reject: false,
      // only return code, no stdio needed
      stdio: "ignore",
    };

    return execa.sync("git", ["rev-parse"], opts).exitCode === 0;
  }

  runValidations() {
    if ((this.options.since !== undefined || this.requiresGit) && !this.gitInitialized()) {
      throw new ValidationError("ENOGIT", "The git binary was not found, or this is not a git repository.");
    }

    if (this.options.independent && !this.project.isIndependent()) {
      throw new ValidationError(
        "EVERSIONMODE",
        dedent`
          You ran lerna with --independent or -i, but the repository is not set to independent mode.
          To use independent mode you need to set lerna.json's "version" property to "independent".
          Then you won't need to pass the --independent or -i flags.
        `
      );
    }
  }

  runPreparations() {
    if (!this.composed && this.project.isIndependent()) {
      // composed commands have already logged the independent status
      log.info("versioning", "independent");
    }

    if (!this.composed && this.options.ci) {
      log.info("ci", "enabled");
    }

    let chain = Promise.resolve();

    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chain = chain.then(() => this.project.getPackages());
    chain = chain.then((packages) => {
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.packageGraph = new PackageGraph(packages);
    });

    return chain;
  }

  runCommand() {
    return Promise.resolve()
      .then(() => this.initialize())
      .then((proceed) => {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (proceed !== false) {
          return this.execute();
        }
        // early exits set their own exitCode (if non-zero)
      });
  }

  initialize() {
    throw new ValidationError(this.name, "initialize() needs to be implemented.");
  }

  execute() {
    throw new ValidationError(this.name, "execute() needs to be implemented.");
  }
}
