#!/usr/bin/env node
import * as yargs from "yargs";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { URL } from "url";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const version = require("lerna/commands/version");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const publish = require("lerna/commands/publish");

function hideFromGitIndex(uncommittedFiles: string[]) {
  execSync(`git update-index --assume-unchanged ${uncommittedFiles.join(" ")}`);

  return () => execSync(`git update-index --no-assume-unchanged ${uncommittedFiles.join(" ")}`);
}

(async () => {
  const options = await parseArgs();
  if (!options.local && !options.force) {
    console.log("Authenticating to NPM");
    execSync("npm adduser", {
      stdio: [0, 1, 2],
    });
  }

  if (options.clearLocalRegistry) {
    // JH: changed to `npm run`
    execSync("npm run local-registry clear");
  }

  // JH: changed to `npm run`
  const buildCommand = "npm run build";
  console.log(`> ${buildCommand}`);
  execSync(buildCommand, {
    stdio: [0, 1, 2],
  });

  if (options.local) {
    // JH: added change to dist dir
    process.chdir("dist");

    // JH: added alternate package.json and lerna.json in dist
    const distLernaJson = `{
  "useWorkspaces": true,
  "description": "This lerna.json exists to facilitate publish built packages via tools/scripts/lerna-release.ts",
  "version": "0.0.0",
  "ignoreChanges": [
    "**/__fixtures__/**",
    "**/__tests__/**",
    "**/*.md"
  ]
}
`;
    const distPackageJson = `{
  "private": true,
  "description": "This package.json exists to facilitate publish built packages via tools/scripts/lerna-release.ts",
  "workspaces": [
    "packages/*",
    "packages/legacy-structure/commands/*"
  ]
}`;
    writeFileSync("./lerna.json", distLernaJson);
    writeFileSync("./package.json", distPackageJson);

    // Force all projects to be not private
    const projects = JSON.parse(execSync("npx lerna list --json --all").toString());
    for (const proj of projects) {
      if (proj.private) {
        console.log("Publishing private package locally:", proj.name);
        const packageJsonPath = join(proj.location, "package.json");
        const original = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        writeFileSync(packageJsonPath, JSON.stringify({ ...original, private: false }));
      }
    }
  }

  const versionOptions = {
    bump: options.version ? options.version : undefined,
    conventionalCommits: true,
    conventionalPrerelease: options.tag === "next",
    preid: options.preid,
    forcePublish: true,
    createRelease: options.tag !== "next" ? "github" : undefined,
    noChangelog: options.tag === "next",
    tagVersionPrefix: "",
    exact: true,
    gitRemote: options.gitRemote,
    gitTagVersion: options.tag !== "next",
    message: "chore(misc): publish %v",
    loglevel: options.loglevel ?? "info",
    yes: false,
  };

  if (options.local) {
    versionOptions.conventionalCommits = false;
    delete versionOptions.createRelease;
    versionOptions.gitTagVersion = false;
    versionOptions.loglevel = options.loglevel ?? "error";
    versionOptions.yes = true;
    versionOptions.bump = options.version ? options.version : "minor";
  }

  const lernaJsonPath = join(__dirname, "../../lerna.json");
  let originalLernaJson: Buffer | undefined;

  if (options.local || options.tag === "next") {
    originalLernaJson = readFileSync(lernaJsonPath);
  }
  if (options.local) {
    /**
     * Hide changes from Lerna
     */
    const uncommittedFiles = execSync("git diff --name-only --relative HEAD .")
      .toString()
      .split("\n")
      .filter((i) => i.length > 0)
      .filter((f) => existsSync(f));
    const unhideFromGitIndex = hideFromGitIndex(uncommittedFiles);

    process.on("exit", unhideFromGitIndex);
    process.on("SIGTERM", unhideFromGitIndex);
    process.on("SIGINT", unhideFromGitIndex);
  }

  const publishOptions: Record<string, boolean | string | undefined> = {
    gitReset: false,
    distTag: options.tag,
  };

  if (!options.skipPublish) {
    // JH: remove unneeded await
    publish({ ...versionOptions, ...publishOptions });
  } else {
    // JH: remove unneeded await
    version(versionOptions);
    console.warn("Not Publishing because --dryRun was passed");
  }

  if (originalLernaJson) {
    writeFileSync(lernaJsonPath, originalLernaJson);
  }
})();

async function parseArgs() {
  const parsedArgs =
    // JH: refactored to make it compatible with yargs 16, which lerna uses
    await yargs
      // JH: changed to `npm run`
      .scriptName("npm run lerna-release")
      .wrap(144)
      // TODO: why is this showing as a type error in lerna but not nx
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .strictOptions()
      .version(false)
      .command("$0 [version]", "This script is for publishing lerna both locally and publicly", (yargs) => {
        // JH: refactored to make it compatible with yargs 16, which lerna uses
        yargs.positional("version", {
          type: "string",
          description: "The version to publish. This does not need to be passed and can be inferred.",
        });
      })
      .option("skipPublish", {
        type: "boolean",
        description: "Skips the actual publishing for testing out versioning",
      })
      .option("clearLocalRegistry", {
        type: "boolean",
        description:
          "Clear existing versions in the local registry so that you can republish the same version",
        default: true,
      })
      .option("local", {
        type: "boolean",
        description: "Publish lerna locally, not to actual NPM",
        alias: "l",
        default: true,
      })
      .option("force", {
        type: "boolean",
        description: "Don't use this unless you really know what it does",
        hidden: true,
      })
      .option("gitRemote", {
        type: "string",
        description: "Alternate git remote name to publish tags to (useful for testing changelog)",
        default: "origin",
      })
      .option("tag", {
        type: "string",
        description: "NPM Tag",
        choices: ["next", "latest", "previous"],
      })
      .option("preid", {
        type: "string",
        description: "The kind of prerelease tag. (1.0.0-[preid].0)",
        choices: ["alpha", "beta", "rc"],
        default: "beta",
      })
      .option("loglevel", {
        type: "string",
        description: "Log Level",
        choices: ["error", "info", "debug"],
      })
      .example(
        "$0",
        `By default, this will locally publish a minor version bump as latest. Great for local development. Most developers should only need this.`
      )
      .example(
        "$0 --local false",
        `This will really publish a new beta version to npm as next. The version is inferred by the changes.`
      )
      .example(
        "$0 --local false --tag latest",
        `This will really publish a new stable version to npm as latest, tag, commit, push, and create a release on GitHub.`
      )
      .example("$0 --local false --preid rc", `This will really publish a new rc version to npm as next.`)
      .group(["local", "clearLocalRegistry"], "Local Publishing Options for most developers")
      .group(["preid", "tag", "gitRemote", "force"], "Real Publishing Options for actually publishing to NPM")
      .check((args) => {
        const registry = getRegistry();
        const registryIsLocalhost = registry.hostname === "localhost";
        if (!args.local) {
          if (!process.env.GH_TOKEN) {
            throw new Error("process.env.GH_TOKEN is not set");
          }
          if (!args.force && registryIsLocalhost) {
            throw new Error(
              // JH: changed to `npm run`
              'Registry is still set to localhost! Run "npm run local-registry disable" or pass --force'
            );
          }
        } else {
          if (!args.force && !registryIsLocalhost) {
            throw new Error("--local was passed and registry is not localhost");
          }
        }

        return true;
      })
      .parse();

  // JH: made compatible with node v14
  if (parsedArgs.tag === undefined || parsedArgs.tag === null) {
    parsedArgs.tag = parsedArgs.local ? "latest" : "next";
  }

  return parsedArgs;
}

function getRegistry() {
  return new URL(execSync("npm config get registry").toString().trim());
}
