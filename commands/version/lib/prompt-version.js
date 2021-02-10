"use strict";

const semver = require("semver");
const { promptSelectOne, promptTextInput } = require("@lerna/prompt");

module.exports.makePromptVersion = makePromptVersion;

/**
 * @param {(existingPreid: string) => string} resolvePrereleaseId
 */
function makePromptVersion(resolvePrereleaseId) {
  return (/** @type {import("@lerna/package-graph").PackageGraphNode} */ node) =>
    promptVersion(node.version, node.name, resolvePrereleaseId(node.prereleaseId));
}

/**
 * A predicate that prompts user to select/construct a version bump.
 * It can be run per-package (independent) or globally (fixed).
 *
 * @param {string} currentVersion
 * @param {string} name (Only used in independent mode)
 * @param {string} prereleaseId
 */
function promptVersion(currentVersion, name, prereleaseId) {
  const patch = semver.inc(currentVersion, "patch");
  const minor = semver.inc(currentVersion, "minor");
  const major = semver.inc(currentVersion, "major");
  const prepatch = semver.inc(currentVersion, "prepatch", prereleaseId);
  const preminor = semver.inc(currentVersion, "preminor", prereleaseId);
  const premajor = semver.inc(currentVersion, "premajor", prereleaseId);

  const message = `Select a new version ${name ? `for ${name} ` : ""}(currently ${currentVersion})`;

  return promptSelectOne(message, {
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
  }).then((choice) => {
    if (choice === "CUSTOM") {
      return promptTextInput("Enter a custom version", {
        filter: semver.valid,
        // semver.valid() always returns null with invalid input
        validate: (v) => v !== null || "Must be a valid semver version",
      });
    }

    if (choice === "PRERELEASE") {
      const defaultVersion = semver.inc(currentVersion, "prerelease", prereleaseId);
      const prompt = `(default: "${prereleaseId}", yielding ${defaultVersion})`;

      return promptTextInput(`Enter a prerelease identifier ${prompt}`, {
        filter: (v) => semver.inc(currentVersion, "prerelease", v || prereleaseId),
      });
    }

    return choice;
  });
}
