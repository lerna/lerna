"use strict";

const mockCheckWorkingTree = jest.fn(() => Promise.resolve());
const mockThrowIfReleased = jest.fn(() => Promise.resolve());
const mockThrowIfUncommitted = jest.fn(() => Promise.resolve());

module.exports.checkWorkingTree = mockCheckWorkingTree;
module.exports.throwIfReleased = mockThrowIfReleased;
module.exports.throwIfUncommitted = mockThrowIfUncommitted;
