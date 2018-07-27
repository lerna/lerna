"use strict";

const semver = require("semver");
const PromptUtilities = require("@lerna/prompt");

module.exports = promptVersion;

/**
 * A predicate that prompts user to select/construct a version bump.
 * It can be run per-package (independent) or globally (fixed).
 *
 * @param {Package|Object} pkg The metadata to process
 * @property {String} pkg.version
 * @property {String} [pkg.name] (Only used in independent mode)
 */
function promptVersion(pkg) {
  const currentVersion = pkg.version;

  const patch = semver.inc(currentVersion, "patch");
  const minor = semver.inc(currentVersion, "minor");
  const major = semver.inc(currentVersion, "major");
  const prepatch = semver.inc(currentVersion, "prepatch");
  const preminor = semver.inc(currentVersion, "preminor");
  const premajor = semver.inc(currentVersion, "premajor");

  const message = `Select a new version ${pkg.name ? `for ${pkg.name} ` : ""}(currently ${currentVersion})`;

  return PromptUtilities.select(message, {
    choices: [
      { value: patch, name: `Patch (${patch})` },
      { value: minor, name: `Minor (${minor})` },
      { value: major, name: `Major (${major})` },
      { value: prepatch, name: `Prepatch (${prepatch})` },
      { value: preminor, name: `Preminor (${preminor})` },
      { value: premajor, name: `Premajor (${premajor})` },
      { value: "PRERELEASE", name: "Prerelease" },
      { value: "CUSTOM", name: "Custom" },
    ],
  }).then(choice => {
    if (choice === "CUSTOM") {
      return PromptUtilities.input("Enter a custom version", {
        filter: semver.valid,
        validate: v => v !== null || "Must be a valid semver version",
      });
    }

    if (choice === "PRERELEASE") {
      const [existingId] = semver.prerelease(currentVersion) || [];
      const defaultVersion = semver.inc(currentVersion, "prerelease", existingId);
      const prompt = `(default: ${existingId ? `"${existingId}"` : "none"}, yielding ${defaultVersion})`;

      // TODO: allow specifying prerelease identifier as CLI option to skip the prompt
      return PromptUtilities.input(`Enter a prerelease identifier ${prompt}`, {
        filter: v => {
          const preid = v || existingId;
          return semver.inc(currentVersion, "prerelease", preid);
        },
      });
    }

    return choice;
  });
}
