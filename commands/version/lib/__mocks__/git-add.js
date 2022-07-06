"use strict";

// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
module.exports.gitAdd = jest.fn(() => Promise.resolve());
