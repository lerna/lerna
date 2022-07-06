"use strict";

// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
module.exports.getPackagesWithoutLicense = jest.fn(() => Promise.resolve([]));
