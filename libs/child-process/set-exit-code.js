// workaround to allow process.exitCode setting to be mocked via jest when testing
// https://github.com/jestjs/jest/issues/14501
function setExitCode(code) {
  process.exitCode = code;
}

exports.setExitCode = setExitCode;
