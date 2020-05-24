"use strict";

const addRegistry = new Map();

// by default, act like a spy that populates registry
const mockAdd = jest.fn((spec, distTag) => {
  addRegistry.set(spec, distTag);

  return Promise.resolve();
});
const mockList = jest.fn(() => Promise.resolve({}));
const mockRemove = jest.fn(() => Promise.resolve());

// a convenient format for assertions
function addTagged() {
  return Array.from(addRegistry.values());
}

// keep test data isolated
afterEach(() => {
  addRegistry.clear();
});

exports.add = mockAdd;
module.exports.add.registry = addRegistry;
module.exports.add.tagged = addTagged;
exports.list = mockList;
exports.remove = mockRemove;
