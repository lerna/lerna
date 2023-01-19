// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

const mockRunLifecycle = jest.fn((pkg) => Promise.resolve(pkg));
const mockCreateRunner = jest.fn((opts) => (pkg, stage) => {
  // no longer the actual API, but approximates inner logic of default export
  if (pkg.scripts[stage]) {
    return mockRunLifecycle(pkg, stage, opts);
  }

  return Promise.resolve();
});

function getOrderedCalls() {
  return mockRunLifecycle.mock.calls.map(([pkg, script]) => [pkg.name, script]);
}

module.exports.runLifecycle = mockRunLifecycle;
module.exports.createRunner = mockCreateRunner;
module.exports.runLifecycle.getOrderedCalls = getOrderedCalls;
