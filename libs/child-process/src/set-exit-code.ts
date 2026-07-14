// workaround to allow process.exitCode setting to be mocked in tests
// (assignments to process properties cannot be intercepted by the test runner)
export function setExitCode(code: number) {
  process.exitCode = code;
}
