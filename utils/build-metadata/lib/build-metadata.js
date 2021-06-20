"use strict";

module.exports.applyBuildMetadata = applyBuildMetadata;

const BUILD_METADATA_REGEX = new RegExp(`^[0-9a-zA-Z-]+(\\.[0-9a-zA-Z-]+)*$`);

const { ValidationError } = require("@lerna/validation-error");

/**
 * Append build metadata to version.
 *
 * @param {string} version
 * @param {string} buildMetadata
 */
function applyBuildMetadata(version, buildMetadata) {
  if (!buildMetadata) {
    return version;
  }
  if (isValidBuildMetadata(buildMetadata)) {
    return `${version}+${buildMetadata}`;
  }
  throw new ValidationError("EBUILDMETADATA", "Build metadata does not satisfy SemVer specification.");
}

/**
 * Validate build metadata against SemVer specification.
 *
 * @see https://semver.org/#spec-item-10
 *
 * @param {string} buildMetadata
 */
function isValidBuildMetadata(buildMetadata) {
  return BUILD_METADATA_REGEX.test(buildMetadata);
}
