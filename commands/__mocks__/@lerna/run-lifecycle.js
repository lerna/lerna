"use strict";

const mockRunLifecycle = jest.fn(pkg => Promise.resolve(pkg));
const mockCreateRunner = jest.fn(() => (pkg, stage) => {
  if (pkg.scripts[stage]) {
    return mockRunLifecycle(pkg, stage);
  }

  return Promise.resolve(pkg);
});

function getOrderedCalls() {
  return mockRunLifecycle.mock.calls.map(([pkg, script]) => [pkg.name, script]);
}

module.exports = mockRunLifecycle;
module.exports.createRunner = mockCreateRunner;
module.exports.getOrderedCalls = getOrderedCalls;
