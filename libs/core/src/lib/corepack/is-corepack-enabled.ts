export function isCorepackEnabled() {
  // https://github.com/nodejs/corepack#environment-variables
  // The COREPACK_ROOT environment variable is specifically set by Corepack to indicate that it is running.
  return process.env["COREPACK_ROOT"] !== undefined;
}
