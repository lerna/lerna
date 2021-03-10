"use strict";

// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
const mockGetNpmUsername = jest.fn(() => Promise.resolve("lerna-test"));

module.exports.getNpmUsername = mockGetNpmUsername;
