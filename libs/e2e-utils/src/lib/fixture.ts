import { joinPathFragments, readJsonFile, writeJsonFile } from "@nrwl/devkit";
import { exec, spawn } from "child_process";
import { ensureDir, existsSync, readFile, remove, writeFile } from "fs-extra";
import { dump } from "js-yaml";

interface RunCommandOptions {
  silenceError?: boolean;
  env?: Record<string, string>;
  cwd?: string;
  silent?: boolean;
}

type PackageManager = "npm" | "yarn" | "pnpm";

interface FixtureCreateOptions {
  name: string;
  packageManager: PackageManager;
  runLernaInit: boolean;
  initializeGit: boolean;
  installDependencies: boolean;
  e2eRoot: string;
  forceDeterministicTerminalOutput?: boolean;
}

type RunCommandResult = { stdout: string; stderr: string; combinedOutput: string };

const PNPM_STORE = "pnpm.store";
const ORIGIN_GIT = "origin.git";
const REGISTRY = "http://localhost:4872/";

/**
 * A initialized Fixture creates an entry within /tmp/lerna-e2e for the given fixture name with the following structure:
 *
 * /{{ FIXTURE_NAME }}
 *   /origin (a bare git repo which acts as the git origin for the lerna workspace under test)
 *   /lerna-workspace (the lerna workspace under test, created using `lerna init`)
 *
 */
export class Fixture {
  private readonly fixtureRootPath = joinPathFragments(this.e2eRoot, this.name);
  private readonly fixtureWorkspacePath = joinPathFragments(this.fixtureRootPath, "lerna-workspace");
  private readonly fixtureOriginPath = joinPathFragments(this.fixtureRootPath, ORIGIN_GIT);
  private readonly fixturePnpmStorePath = joinPathFragments(this.fixtureRootPath, PNPM_STORE);

  constructor(
    private readonly e2eRoot: string,
    private readonly name: string,
    private readonly packageManager: PackageManager = "npm",
    private readonly forceDeterministicTerminalOutput: boolean
  ) {}

  static async create({
    name,
    packageManager,
    runLernaInit,
    initializeGit,
    installDependencies,
    e2eRoot,
    forceDeterministicTerminalOutput,
  }: FixtureCreateOptions): Promise<Fixture> {
    const fixture = new Fixture(
      e2eRoot,
      // Make the underlying name include the package manager and be globally unique
      uniq(`${name}-${packageManager}`),
      packageManager,
      forceDeterministicTerminalOutput || false
    );

    await fixture.createFixtureRoot();
    await fixture.createGitOrigin();

    if (initializeGit) {
      await fixture.gitCloneEmptyRemoteAsLernaWorkspace();
    } else {
      await fixture.createEmptyDirectoryForWorkspace();
    }

    await fixture.setNpmRegistry();

    if (runLernaInit) {
      const initOptions = packageManager === "pnpm" ? ({ keepDefaultOptions: true } as const) : {};
      await fixture.lernaInit("", initOptions);
    }

    await fixture.initializeNpmEnvironment();

    if (installDependencies) {
      await fixture.install();
    }

    return fixture;
  }

  static fromExisting(e2eRoot: string, fixtureRootPath: string, forceDeterministicTerminalOutput = false) {
    const fixtureName = fixtureRootPath.split(e2eRoot).pop();
    if (!fixtureName) {
      throw new Error(`Could not determine fixture name from path: ${fixtureRootPath}`);
    }
    const packageManager = Fixture.inferPackageManagerFromExistingFixture(fixtureRootPath);
    return new Fixture(e2eRoot, fixtureName, packageManager, forceDeterministicTerminalOutput);
  }

  private static inferPackageManagerFromExistingFixture(fixtureRootPath: string): PackageManager {
    if (existsSync(joinPathFragments(fixtureRootPath, "lerna-workspace", "pnpm-workspace.yaml"))) {
      return "pnpm";
    }
    if (existsSync(joinPathFragments(fixtureRootPath, "lerna-workspace", "yarn.lock"))) {
      return "yarn";
    }
    return "npm";
  }

  async readOutput(fileName: string) {
    return readFile(
      joinPathFragments(this.fixtureWorkspacePath, "node_modules/.lerna-test-outputs", `${fileName}.txt`),
      "utf8"
    );
  }

  private async setNpmRegistry(): Promise<void> {
    if (this.packageManager === "pnpm") {
      await this.exec(`mkdir ${this.fixturePnpmStorePath}`);
      await this.exec(
        `echo "registry=${REGISTRY}\nstore-dir=${this.fixturePnpmStorePath}\nverify-store-integrity=false" > .npmrc`
      );
    }
  }

  private async initializeNpmEnvironment(): Promise<void> {
    if (
      this.packageManager !== "npm" &&
      existsSync(joinPathFragments(this.fixtureWorkspacePath, "lerna.json"))
    ) {
      await this.overrideLernaConfig({ npmClient: this.packageManager });
    }

    if (this.packageManager === "pnpm") {
      const pnpmWorkspaceContent = dump({
        packages: ["packages/*", "!**/__test__/**"],
      });
      await writeFile(this.getWorkspacePath("pnpm-workspace.yaml"), pnpmWorkspaceContent, "utf-8");
    }
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
   * Check if a workspace file exists.
   */
  async workspaceFileExists(file: string): Promise<boolean> {
    return existsSync(this.getWorkspacePath(file));
  }

  /**
   * Execute a given command in the root of the lerna workspace under test within the fixture.
   * This has been given a terse name to help with readability in the spec files.
   */
  async exec(
    command: string,
    opts: RunCommandOptions = {
      silenceError: false,
      env: undefined,
    }
  ): Promise<RunCommandResult> {
    return this.execImpl(command, { ...opts, cwd: opts.cwd ?? this.fixtureWorkspacePath });
  }

  /**
   * Resolve the locally published version of lerna and run the `init` command, with an optionally
   * provided arguments. Reverts useNx and useWorkspaces to false when options.keepDefaultOptions is not provided, since those options are off for most users.
   */
  async lernaInit(args?: string, options?: { keepDefaultOptions?: true }): Promise<RunCommandResult> {
    let execCommandResult: Promise<RunCommandResult>;
    switch (this.packageManager) {
      case "npm":
        execCommandResult = this.exec(
          `npx --registry=${REGISTRY} --yes lerna@${getPublishedVersion()} init ${args || ""}`
        );
        break;
      case "yarn":
        execCommandResult = this.exec(
          `npx --registry=${REGISTRY} --yes lerna@${getPublishedVersion()} init ${args || ""}`
        );
        break;
      case "pnpm":
        execCommandResult = this.exec(`pnpm dlx lerna@${getPublishedVersion()} init ${args || ""}`);
        break;
      default:
        throw new Error(`Unsupported package manager: ${this.packageManager}`);
    }

    const initResult = await execCommandResult;
    if (!options?.keepDefaultOptions) {
      await this.revertDefaultInitOptions();
    }

    return initResult;
  }

  async overrideLernaConfig(lernaConfig: Record<string, any>): Promise<void> {
    return this.updateJson("lerna.json", (json) => ({
      ...json,
      ...lernaConfig,
    }));
  }

  private async revertDefaultInitOptions(): Promise<void> {
    await this.overrideLernaConfig({
      useWorkspaces: false,
      packages: ["packages/*"],
    });
    await this.updateJson("package.json", (json) => {
      const newJson = { ...json };
      delete newJson.workspaces;
      return newJson;
    });
  }

  /**
   * Execute the install command of the configured package manager for the current fixture.
   * This has been given a terse name to help with readability in the spec files.
   */
  async install(args?: string): Promise<RunCommandResult> {
    switch (this.packageManager) {
      case "npm":
        return this.exec(`npm --registry=${REGISTRY} install${args ? ` ${args}` : ""}`);
      case "yarn":
        return this.exec(`yarn --registry=${REGISTRY} install${args ? ` ${args}` : ""}`);
      case "pnpm":
        return this.exec(`pnpm install${args ? ` ${args}` : ""}`);
      default:
        throw new Error(`Unsupported package manager: ${this.packageManager}`);
    }
  }

  /**
   * Execute a command using the locally installed instance of the lerna CLI.
   * This has been given a terse name to help with readability in the spec files.
   */
  async lerna(
    args: string,
    opts: { silenceError?: true; allowNetworkRequests?: true } = {}
  ): Promise<RunCommandResult> {
    const offlineFlag = opts.allowNetworkRequests ? "" : "--offline ";
    switch (this.packageManager) {
      case "npm":
        return this.exec(`npx ${offlineFlag}--no lerna ${args}`, { silenceError: opts.silenceError });
      case "yarn":
        return this.exec(`npx ${offlineFlag}--no lerna ${args}`, { silenceError: opts.silenceError });
      case "pnpm":
        return this.exec(`pnpm exec lerna ${args}`, { silenceError: opts.silenceError });
      default:
        throw new Error(`Unsupported package manager: ${this.packageManager}`);
    }
  }

  async lernaWatch(inputArgs: string): Promise<(timeoutMs?: number) => Promise<RunCommandResult>> {
    return new Promise((resolve, reject) => {
      const command = `npx --offline --no -c 'lerna watch --verbose ${inputArgs}'`;

      let stdout = "";
      let stderr = "";
      let combinedOutput = "";
      let error: Error | null = null;

      const createResult = (): RunCommandResult => ({
        stdout: stripConsoleColors(stdout),
        stderr: stripConsoleColors(stderr),
        combinedOutput: stripConsoleColors(combinedOutput),
      });

      const childProcess = spawn(command, {
        shell: true,
        cwd: this.fixtureWorkspacePath,
        env: {
          ...process.env,
          FORCE_COLOR: "false",
        },
      });

      childProcess.stdout.setEncoding("utf8");
      childProcess.stdout.on("data", (chunk) => {
        stdout += chunk;
        combinedOutput += chunk;

        if (chunk.toString().trim().includes("watch process waiting")) {
          resolve(
            (timeoutMs = 6000) =>
              new Promise((resolve) => {
                setTimeout(() => {
                  childProcess.kill();
                  resolve(createResult());
                }, timeoutMs);
              })
          );
        }
      });

      childProcess.stderr.setEncoding("utf8");
      childProcess.stderr.on("data", (chunk) => {
        stderr += chunk;
        combinedOutput += chunk;
      });

      childProcess.on("error", (err) => {
        error = err;
      });

      childProcess.on("close", () => {
        if (error) {
          reject(error);
        } else if (stderr.includes("lerna ERR!")) {
          reject(new Error(stderr));
        }
      });
    });
  }

  async addNxJsonToWorkspace(): Promise<void> {
    writeJsonFile(this.getWorkspacePath("nx.json"), {
      extends: "nx/presets/npm.json",
      tasksRunnerOptions: {
        default: {
          runner: "nx/tasks-runners/default",
        },
      },
    });
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
    await this.exec("git checkout -b test-main");
    await writeFile(this.getWorkspacePath(".gitignore"), "node_modules\n.DS_Store");
    await this.exec("git add .gitignore");
    await this.exec("git add .");
    await this.exec('git commit -m "initial-commit"');
  }

  async updateJson(path: string, updateFn: (json: Record<string, unknown>) => Record<string, unknown>) {
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
    /**
     * For certain commands combining independent streams for stdout and stderr is not viable,
     * because it produces too much non-determinism in the final output being asserted in the test.
     *
     * We therefore provide a way for a fixture to opt-in to an alternative command execution implementation
     * in which we simply append the stderr contents to the stdout contents in a deterministic manner.
     */
    if (this.forceDeterministicTerminalOutput) {
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
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(" ");

      let stdout = "";
      let stderr = "";
      let combinedOutput = "";
      let error: Error | null = null;

      const childProcess = spawn(cmd, args, {
        shell: true,
        cwd: opts.cwd || this.fixtureRootPath,
        env: {
          ...(opts.env || process.env),
          FORCE_COLOR: "false",
        },
      });

      childProcess.stdout.setEncoding("utf8");
      childProcess.stdout.on("data", (chunk) => {
        stdout += chunk;
        combinedOutput += chunk;
      });

      childProcess.stderr.setEncoding("utf8");
      childProcess.stderr.on("data", (chunk) => {
        stderr += chunk;
        combinedOutput += chunk;
      });

      childProcess.on("error", (err) => {
        error = err;
      });

      childProcess.on("close", (code) => {
        if (!opts.silenceError) {
          if (error) {
            reject(error);
          } else if (code !== 0) {
            reject(new Error(stderr));
          }
        }

        resolve({
          stdout: stripConsoleColors(stdout),
          stderr: stripConsoleColors(stderr),
          combinedOutput: stripConsoleColors(combinedOutput),
        });
      });
    });
  }

  private async createFixtureRoot(): Promise<void> {
    await ensureDir(this.fixtureRootPath);
  }

  private async createGitOrigin(): Promise<void> {
    await this.execImpl(`git init --bare ${ORIGIN_GIT}`);
  }

  /**
   * This gives us an empty directory as our starting point (ready to run `lerna init` on)
   * but with the advantage that it is already a git repository with the local origin
   * correctly configured.
   */
  private async gitCloneEmptyRemoteAsLernaWorkspace(): Promise<void> {
    await this.execImpl(`git clone ${this.fixtureOriginPath} ${this.fixtureWorkspacePath}`);
  }

  /**
   * This gives us an empty directory as our starting point with no git data at all, so that
   * we can also test running `lerna init` under those conditions.
   */
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
    // fallback to known e2e version
    "999.9.9-e2e.0";
  return process.env.PUBLISHED_VERSION;
}

function uniq(prefix: string) {
  return `${prefix}-${Math.floor(Math.random() * 10000000)}`;
}
