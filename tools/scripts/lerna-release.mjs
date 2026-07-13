#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { URL } from "node:url";
import publish from "lerna/commands/publish";
import version from "lerna/commands/version";
import yargs from "yargs";

(async () => {
  const options = await parseArgs();
  if (!options.local && !options.force && !options.noInteractive) {
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

  const versionOptions = {
    bump: options.version ? options.version : undefined,
    conventionalCommits: true,
    conventionalPrerelease: options.tag === "next",
    preid: options.preid,
    forcePublish: true,
    createRelease: options.tag !== "next" ? "github" : undefined,
    noChangelog: options.tag === "next",
    tagVersionPrefix: "v",
    exact: true,
    gitRemote: options.gitRemote,
    gitTagVersion: options.tag !== "next",
    message: "chore(misc): publish %v",
    loglevel: options.loglevel ?? "info",
    yes: options.noInteractive,
  };

  if (options.local) {
    versionOptions.conventionalCommits = false;
    delete versionOptions.createRelease;
    versionOptions.gitTagVersion = false;
    versionOptions.loglevel = options.loglevel ?? "error";
    versionOptions.yes = true;
    versionOptions.bump = options.version ? options.version : "minor";
  }

  const rootPath = join(import.meta.dirname, "../..");
  const lernaJsonPath = join(rootPath, "lerna.json");
  const filesToRestore = [];
  if (options.local) {
    filesToRestore.push(
      lernaJsonPath,
      join(rootPath, "package.json"),
      join(rootPath, "package-lock.json"),
      join(rootPath, "packages/lerna/package.json")
    );
  } else if (options.tag === "next") {
    filesToRestore.push(lernaJsonPath);
  }
  const originalFiles = new Map(filesToRestore.map((filePath) => [filePath, readFileSync(filePath)]));

  const publishOptions = {
    gitReset: !!options.local,
    distTag: options.tag,
    includePrivate: options.local ? "*" : undefined,
  };

  try {
    if (!options.skipPublish) {
      await publish({ ...versionOptions, ...publishOptions });
    } else {
      await version(versionOptions);
      console.warn("Not Publishing because --dryRun was passed");
    }
  } finally {
    for (const [filePath, contents] of originalFiles) {
      writeFileSync(filePath, contents);
    }
  }
})();

async function parseArgs() {
  const parsedArgs =
    // JH: refactored to make it compatible with yargs 16, which lerna uses
    await yargs(process.argv.slice(2))
      // JH: changed to `npm run`
      .scriptName("npm run lerna-release")
      .wrap(144)
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
      .option("noInteractive", {
        type: "boolean",
        description: "Don't perform interactive operations (useful for CI)",
        default: false,
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

  if (parsedArgs.tag === undefined || parsedArgs.tag === null) {
    parsedArgs.tag = parsedArgs.local ? "latest" : "next";
  }

  return parsedArgs;
}

function getRegistry() {
  return new URL(execSync("npm config get registry").toString().trim());
}
