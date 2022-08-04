// @ts-check

"use strict";

const pWaterfall = require("p-waterfall");

function updatePackageVersions(tree, schema) {
    const { conventionalCommits, changelogPreset, changelog = true } = schema.options;
    const independentVersions = schema.project.isIndependent();
    const rootPath = schema.project.manifest.location;
    const changedFiles = new Set();

    // my kingdom for async await :(
    let chain = Promise.resolve();

    // preversion:  Run BEFORE bumping the package version.
    // version:     Run AFTER bumping the package version, but BEFORE commit.
    // postversion: Run AFTER bumping the package version, and AFTER commit.
    // @see https://docs.npmjs.com/misc/scripts

    if (!schema.hasRootedLeaf) {
      // exec preversion lifecycle in root (before all updates)
      chain = chain.then(() => this.runRootLifecycle("preversion"));
    }
}

exports.generatorFactory = function generatorFactory(lernaLogger) {
  return async function generatorImplementation(tree, schema) {
    const tasks = [() => console.log("this.updatePackageVersions()")];

    if (schema.commitAndTag) {
      tasks.push(() => console.log("this.commitAndTagUpdates()"));
    } else {
      lernaLogger.info("execute", "Skipping git tag/commit");
    }

    if (schema.pushToRemote) {
      tasks.push(() => console.log("this.gitPushToRemote()"));
    } else {
      lernaLogger.info("execute", "Skipping git push");
    }

    if (schema.releaseClient) {
      lernaLogger.info("execute", "Creating releases...");
      tasks.push(() =>
        console.log(`createRelease(
            this.releaseClient,
            { tags: this.tags, releaseNotes: this.releaseNotes },
            { gitRemote: this.options.gitRemote, execOpts: this.execOpts }
          )`)
      );
    } else {
      lernaLogger.info("execute", "Skipping releases");
    }

    return pWaterfall(tasks).then(() => {
      if (!schema.composed) {
        lernaLogger.success("version", "finished");
      }

      return {
        updates: schema.updates,
        updatesVersions: schema.updatesVersions,
      };
    });
  };
};
