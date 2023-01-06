import { ValidationError } from "../validation-error";

const BUILD_METADATA_REGEX = /^[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*$/;

/**
 * Append build metadata to version.
 */
export function applyBuildMetadata(version: string, buildMetadata: string) {
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
 */
function isValidBuildMetadata(buildMetadata: string) {
  return BUILD_METADATA_REGEX.test(buildMetadata);
}
