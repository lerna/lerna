import { joinPathFragments, readJsonFile, writeJsonFile } from "@nrwl/devkit";
import { exec } from "child_process";
import { ensureDir, ensureDirSync, readFile, remove, writeFile } from "fs-extra";
import isCI from "is-ci";
import { dirSync } from "tmp";

interface RunCommandOptions {
  silenceError?: boolean;
  env?: Record<string, string>;
  cwd?: string;
  silent?: boolean;
}

type RunCommandResult = { stdout: string; stderr: string; combinedOutput: string };

const ORIGIN_GIT = "origin.git";
const REGISTRY = "http://localhost:4872/";

export const E2E_ROOT = isCI
  ? dirSync({ prefix: "lerna-e2e-" }).name
  : joinPathFragments("/tmp", "lerna-e2e");

ensureDirSync(E2E_ROOT);

/**
 * A initialized Fixture creates an entry within /tmp/lerna-e2e for the given fixture name with the following structure:
 *
 * /{{ FIXTURE_NAME }}
 *   /origin (a bare git repo which acts as the git origin for the lerna workspace under test)
 *   /lerna-workspace (the lerna workspace under test, created using `lerna init`)
 *
 */
export class Fixture {
  private readonly fixtureRootPath = joinPathFragments(E2E_ROOT, this.name);
  private readonly fixtureWorkspacePath = joinPathFragments(this.fixtureRootPath, "lerna-workspace");
  private readonly fixtureOriginPath = joinPathFragments(this.fixtureRootPath, ORIGIN_GIT);

  constructor(private readonly name: string, private readonly packageManager: "npm" = "npm") {}

  /**
   * Perform the necessary setup in order to begin testing lerna behavior.
   *
   * NOTE: We intentionally do not run `lerna init` within the fixture init, because `lerna init` itself
   * needs to be transparently tested with its various options configured.
   */
  async init(): Promise<void> {
    this.createFixtureRoot();
    await this.createGitOrigin();
    this.createEmptyDirectoryForWorkspace();
  }

  /**
   * Tear down the entirety of the fixture including the git origin and the lerna workspace under test.
   */
  async destroy(): Promise<void> {
    await remove(this.fixtureRootPath);
  }

  /**
   * Resolve the file path of a given file within the lerna workspace under test.
   */
  getWorkspacePath(path?: string): string {
    return path ? joinPathFragments(this.fixtureWorkspacePath, path) : this.fixtureWorkspacePath;
  }

  /**
   * Read the contents of a given file within the lerna workspace under test.
   */
  async readWorkspaceFile(file: string): Promise<string> {
    return readFile(this.getWorkspacePath(file), "utf-8");
  }

  /**
   * Execute a given command in the root of the lerna workspace under test within the fixture.
   * This has been given a terse name to help with readability in the spec files.
   */
  async exec(
    command: string,
    opts: Exclude<RunCommandOptions, "cwd"> = {
      silenceError: false,
      env: undefined,
    }
  ): Promise<RunCommandResult> {
    return this.execImpl(command, { ...opts, cwd: this.fixtureWorkspacePath });
  }

  /**
   * Resolve the locally published version of lerna and run the `init` command, with an optionally
   * provided arguments.
   */
  async lernaInit(args?: string): Promise<RunCommandResult> {
    return this.exec(
      `npx --registry=http://localhost:4872/ --yes lerna@${getPublishedVersion()} init ${args || ""}`
    );
  }

  /**
   * Execute the install command of the configured package manager for the current fixture.
   * This has been given a terse name to help with readability in the spec files.
   */
  async install(args?: string): Promise<RunCommandResult> {
    switch (this.packageManager) {
      case "npm":
        return this.exec(`npm --registry=${REGISTRY} install${args ? ` ${args}` : ""}`);
      default:
        throw new Error(`Unsupported package manager: ${this.packageManager}`);
    }
  }

  /**
   * Execute a command using the locally installed instance of the lerna CLI.
   * This has been given a terse name to help with readability in the spec files.
   */
  async lerna(args: string): Promise<RunCommandResult> {
    // Ensure we reference the locally installed copy of lerna
    return this.exec(`npx --offline --no lerna ${args}`);
  }

  async addNxToWorkspace(): Promise<void> {
    await this.updateJson("lerna.json", (json) => ({
      ...json,
      useNx: true,
    }));

    writeJsonFile(this.getWorkspacePath("nx.json"), {
      extends: "nx/presets/npm.json",
      tasksRunnerOptions: {
        default: {
          runner: "nx/tasks-runners/default",
        },
      },
    });

    await this.install("-D nx@latest");
  }

  async addPackagesDirectory(path: string): Promise<void> {
    await this.updateJson("lerna.json", (json) => ({
      ...json,
      packages: [...(json.packages as string[]), `${path}/*`],
    }));
  }

  async addDependencyToPackage({
    packagePath,
    dependencyName,
    version,
  }: {
    packagePath: string;
    dependencyName: string;
    version: string;
  }): Promise<void> {
    await this.updateJson(`${packagePath}/package.json`, (json) => ({
      ...json,
      dependencies: {
        ...(json.dependencies as Record<string, string>),
        [dependencyName]: version,
      },
    }));
  }

  async addScriptsToPackage({
    packagePath,
    scripts,
  }: {
    packagePath: string;
    scripts: Record<string, string>;
  }): Promise<void> {
    await this.updateJson(`${packagePath}/package.json`, (json) => ({
      ...json,
      scripts: {
        ...(json.scripts as Record<string, string>),
        ...scripts,
      },
    }));
  }

  async updatePackageVersion({
    packagePath,
    newVersion,
  }: {
    packagePath: string;
    newVersion: string;
  }): Promise<void> {
    await this.updateJson(`${packagePath}/package.json`, (json) => ({
      ...json,
      version: newVersion,
    }));
  }

  async createInitialGitCommit(): Promise<void> {
    await this.exec("git init");
    await this.exec("git checkout -b test-main");
    await writeFile(this.getWorkspacePath(".gitignore"), "node_modules\n.DS_Store");
    await this.exec("git add .gitignore");
    await this.exec("git add .");
    await this.exec('git commit -m "initial-commit"');
  }

  private async updateJson(
    path: string,
    updateFn: (json: Record<string, unknown>) => Record<string, unknown>
  ) {
    const jsonPath = this.getWorkspacePath(path);
    const json = readJsonFile(jsonPath) as Record<string, unknown>;

    writeJsonFile(jsonPath, updateFn(json));
  }

  /**
   * The underlying child_process implementation, not exposed to consumers of the fixture. This separation of
   * "within lerna workspace vs not" is necessary because there are certain commands we need to run at the root
   * of the overall fixture (e.g. around setting up the git origin).
   */
  private async execImpl(
    command: string,
    opts: RunCommandOptions = {
      silenceError: false,
      env: undefined,
      cwd: undefined,
    }
  ): Promise<RunCommandResult> {
    return new Promise((resolve, reject) => {
      exec(
        command,
        {
          cwd: opts.cwd || this.fixtureRootPath,
          env: {
            ...(opts.env || process.env),
            FORCE_COLOR: "false",
          },
          encoding: "utf-8",
        },
        (err, stdout, stderr) => {
          if (!opts.silenceError && err) {
            reject(err);
          }
          resolve({
            stdout: stripConsoleColors(stdout),
            stderr: stripConsoleColors(stderr),
            combinedOutput: stripConsoleColors(`${stdout}${stderr}`),
          });
        }
      );
    });
  }

  private async createFixtureRoot(): Promise<void> {
    await ensureDir(this.fixtureRootPath);
  }

  private async createGitOrigin(): Promise<void> {
    await this.execImpl(`git init --bare ${ORIGIN_GIT}`);
  }

  private async createEmptyDirectoryForWorkspace(): Promise<void> {
    await ensureDir(this.fixtureWorkspacePath);
  }
}

/**
 * Remove log colors for fail proof string search
 * @param log
 * @returns
 */
function stripConsoleColors(log: string): string {
  // eslint-disable-next-line no-control-regex
  return log.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}

function getPublishedVersion(): string {
  process.env.PUBLISHED_VERSION =
    process.env.PUBLISHED_VERSION ||
    // fallback to latest if built package is missing
    "latest";
  return process.env.PUBLISHED_VERSION;
}
