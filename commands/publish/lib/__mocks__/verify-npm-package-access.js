"use strict";

// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
const mockVerifyNpmPackageAccess = jest.fn(() => Promise.resolve());

module.exports.verifyNpmPackageAccess = mockVerifyNpmPackageAccess;
