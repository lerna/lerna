"use strict";

const mockAdd = jest.fn(() => Promise.resolve());
const mockCheck = jest.fn(() => true);
const mockRemove = jest.fn(() => Promise.resolve());

exports.add = mockAdd;
exports.check = mockCheck;
exports.remove = mockRemove;
