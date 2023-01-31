"use strict";

const mockAdd = jest.fn(() => Promise.resolve());
const mockList = jest.fn(() => Promise.resolve({}));
const mockRemove = jest.fn(() => Promise.resolve());

exports.add = mockAdd;
exports.list = mockList;
exports.remove = mockRemove;
