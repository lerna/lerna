// workaround to allow process.exitCode setting to be mocked via jest when testing
// https://github.com/jestjs/jest/issues/14501
export function setExitCode(code: number) {
  process.exitCode = code;
}
