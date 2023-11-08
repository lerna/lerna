import {
  Arguments,
  Command,
  CommandConfigOptions,
  filterProjects,
  getPackage,
  Package,
  Profiler,
  ProjectGraphProjectNodeWithPackage,
  runProjectsTopologically,
  ValidationError,
} from "@lerna/core";
import pMap from "p-map";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports = function factory(argv: Arguments<ExecCommandConfigOptions>) {
  return new ExecCommand(argv);
};

interface ExecCommandConfigOptions extends CommandConfigOptions {
  cmd?: string;
  args?: string[];
  bail?: boolean;
  prefix?: boolean;
  parallel?: boolean;
  profile?: boolean;
  profileLocation?: string;
  rejectCycles?: boolean;
}

class ExecCommand extends Command {
  options: ExecCommandConfigOptions;

  command?: string;
  args?: string[];
  bail?: boolean;
  prefix?: boolean;
  env?: NodeJS.ProcessEnv;
  filteredProjects?: ProjectGraphProjectNodeWithPackage[];
  count?: number;
  packagePlural?: string;
  joinedCommand?: string;

  get requiresGit() {
    return false;
  }

  override async initialize() {
    const dashedArgs = this.options["--"] || [];

    this.command = this.options.cmd || dashedArgs.shift();
    this.args = (this.options.args || []).concat(dashedArgs);

    if (!this.command) {
      throw new ValidationError("ENOCOMMAND", "A command to execute is required");
    }

    // inverted boolean options
    this.bail = this.options.bail !== false;
    this.prefix = this.options.prefix !== false;

    // accessing properties of process.env can be expensive,
    // so cache it here to reduce churn during tighter loops
    this.env = Object.assign({}, process.env);

    this.filteredProjects = filterProjects(this.projectGraph, this.execOpts, this.options);

    this.count = this.filteredProjects.length;
    this.packagePlural = this.count === 1 ? "package" : "packages";
    this.joinedCommand = [this.command].concat(this.args).join(" ");
  }

  override async execute() {
    this.logger.info(
      "",
      "Executing command in %d %s: %j",
      this.count,
      this.packagePlural,
      this.joinedCommand
    );

    let runCommand: () => Promise<unknown>;
    if (this.options.parallel) {
      runCommand = () => this.runCommandInPackagesParallel();
    } else if (this.toposort) {
      runCommand = () => this.runCommandInPackagesTopological();
    } else {
      runCommand = () => this.runCommandInPackagesLexical();
    }

    if (this.bail) {
      // only the first error is caught
      try {
        await runCommand();
      } catch (err) {
        process.exitCode = err.exitCode;

        // rethrow to halt chain and log properly
        throw err;
      }
    } else {
      const results = (await runCommand()) as { failed: boolean; exitCode: number }[];
      // detect error (if any) from collected results
      if (results.some((result) => result.failed)) {
        // propagate "highest" error code, it's probably the most useful
        const codes = results.filter((result) => result.failed).map((result) => result.exitCode);
        const exitCode = Math.max(...codes, 1);

        this.logger.error("", "Received non-zero exit code %d during execution", exitCode);
        process.exitCode = exitCode;
      }
    }

    this.logger.success(
      "exec",
      "Executed command in %d %s: %j",
      this.count,
      this.packagePlural,
      this.joinedCommand
    );
  }

  private getOpts(pkg: Package) {
    // these options are passed _directly_ to execa
    return {
      cwd: pkg.location,
      shell: true,
      extendEnv: false,
      env: Object.assign({}, this.env, {
        LERNA_PACKAGE_NAME: pkg.name,
        LERNA_ROOT_PATH: this.project.rootPath,
      }),
      reject: this.bail,
      pkg,
    };
  }

  private getRunner() {
    return this.options.stream
      ? (pkg: Package) => this.runCommandInPackageStreaming(pkg)
      : (pkg: Package) => this.runCommandInPackageCapturing(pkg);
  }

  private runCommandInPackagesTopological() {
    let profiler: Profiler;
    let runner: (pkg: Package) => Promise<unknown>;

    if (this.options.profile) {
      profiler = new Profiler({
        concurrency: this.concurrency,
        log: this.logger,
        outputDirectory: this.options.profileLocation || this.project.rootPath,
      });

      const callback = this.getRunner();
      runner = (pkg) => profiler.run(() => callback(pkg), pkg.name);
    } else {
      runner = this.getRunner();
    }

    let chain = runProjectsTopologically(
      this.filteredProjects,
      this.projectGraph,
      (p) => runner(getPackage(p)),
      {
        concurrency: this.concurrency,
        rejectCycles: this.options.rejectCycles,
      }
    );

    if (profiler) {
      chain = chain.then((results) => profiler.output().then(() => results));
    }

    return chain;
  }

  runCommandInPackagesParallel() {
    return pMap(this.filteredProjects, (p) => this.runCommandInPackageStreaming(getPackage(p)));
  }

  runCommandInPackagesLexical() {
    return pMap(this.filteredProjects, (p) => this.getRunner()(getPackage(p)), {
      concurrency: this.concurrency,
    });
  }

  runCommandInPackageStreaming(pkg) {
    return childProcess.spawnStreaming(this.command, this.args, this.getOpts(pkg), this.prefix && pkg.name);
  }

  runCommandInPackageCapturing(pkg) {
    return childProcess.spawn(this.command, this.args, this.getOpts(pkg));
  }
}

module.exports.ExecCommand = ExecCommand;
