import { applyBuildMetadata, promptSelectOne, promptTextInput } from "@lerna/core";
import semver from "semver";

module.exports.makePromptVersion = makePromptVersion;

/**
 * @param {(existingPreid: string) => string} resolvePrereleaseId
 * @param {string} buildMetadata
 */
function makePromptVersion(resolvePrereleaseId, buildMetadata) {
  return (/** @type {import("@lerna/package-graph").PackageGraphNode} */ node) =>
    promptVersion(node.version, node.name, resolvePrereleaseId(node.prereleaseId), buildMetadata);
}

/**
 * A predicate that prompts user to select/construct a version bump.
 * It can be run per-package (independent) or globally (fixed).
 *
 * @param {string} currentVersion
 * @param {string} name (Only used in independent mode)
 * @param {string} prereleaseId
 * @param {string} buildMetadata
 */
function promptVersion(currentVersion, name, prereleaseId, buildMetadata) {
  const patch = applyBuildMetadata(semver.inc(currentVersion, "patch"), buildMetadata);
  const minor = applyBuildMetadata(semver.inc(currentVersion, "minor"), buildMetadata);
  const major = applyBuildMetadata(semver.inc(currentVersion, "major"), buildMetadata);
  const prepatch = applyBuildMetadata(semver.inc(currentVersion, "prepatch", prereleaseId), buildMetadata);
  const preminor = applyBuildMetadata(semver.inc(currentVersion, "preminor", prereleaseId), buildMetadata);
  const premajor = applyBuildMetadata(semver.inc(currentVersion, "premajor", prereleaseId), buildMetadata);

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
        filter: (v) =>
          applyBuildMetadata(semver.inc(currentVersion, "prerelease", v || prereleaseId), buildMetadata),
      });
    }

    return choice;
  });
}
