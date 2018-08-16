"use strict";

const semver = require("semver");
const PromptUtilities = require("@lerna/prompt");

module.exports = makePromptVersion;

function makePromptVersion(resolvePrereleaseId) {
  return node => promptVersion(node.version, node.name, resolvePrereleaseId(node.prereleaseId));
}

/**
 * A predicate that prompts user to select/construct a version bump.
 * It can be run per-package (independent) or globally (fixed).
 *
 * @param {PackageGraphNode|Object} node The metadata to process
 * @property {String} currentVersion
 * @property {String} name (Only used in independent mode)
 * @property {String} prereleaseId
 */
function promptVersion(currentVersion, name, prereleaseId) {
  const patch = semver.inc(currentVersion, "patch");
  const minor = semver.inc(currentVersion, "minor");
  const major = semver.inc(currentVersion, "major");
  const prepatch = semver.inc(currentVersion, "prepatch", prereleaseId);
  const preminor = semver.inc(currentVersion, "preminor", prereleaseId);
  const premajor = semver.inc(currentVersion, "premajor", prereleaseId);

  const message = `Select a new version ${name ? `for ${name} ` : ""}(currently ${currentVersion})`;

  return PromptUtilities.select(message, {
    choices: [
      { value: patch, name: `Patch (${patch})` },
      { value: minor, name: `Minor (${minor})` },
      { value: major, name: `Major (${major})` },
      { value: prepatch, name: `Prepatch (${prepatch})` },
      { value: preminor, name: `Preminor (${preminor})` },
      { value: premajor, name: `Premajor (${premajor})` },
      { value: "PRERELEASE", name: "Custom Prerelease" },
      { value: "CUSTOM", name: "Custom Version" },
    ],
  }).then(choice => {
    if (choice === "CUSTOM") {
      return PromptUtilities.input("Enter a custom version", {
        filter: semver.valid,
        // semver.valid() always returns null with invalid input
        validate: v => v !== null || "Must be a valid semver version",
      });
    }

    if (choice === "PRERELEASE") {
      const defaultVersion = semver.inc(currentVersion, "prerelease", prereleaseId);
      const prompt = `(default: "${prereleaseId}", yielding ${defaultVersion})`;

      return PromptUtilities.input(`Enter a prerelease identifier ${prompt}`, {
        filter: v => semver.inc(currentVersion, "prerelease", v || prereleaseId),
      });
    }

    return choice;
  });
}
