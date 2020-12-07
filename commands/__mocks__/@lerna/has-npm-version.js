"use strict";

const mockHasNpmVersion = jest.fn(() => true);
const mockMakePredicate = jest.fn(() => (range) => mockHasNpmVersion(range));

module.exports = mockHasNpmVersion;
module.exports.hasNpmVersion = mockHasNpmVersion;
module.exports.makePredicate = mockMakePredicate;
