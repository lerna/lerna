"use strict";

const mockRunLifecycle = jest.fn(() => Promise.resolve());

function getOrderedCalls() {
  return mockRunLifecycle.mock.calls.map(([pkg, script]) => [pkg.name, script]);
}

module.exports = mockRunLifecycle;
module.exports.getOrderedCalls = getOrderedCalls;
