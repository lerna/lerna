"use strict";

// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
module.exports = jest.fn(() => Promise.resolve("MOCK_OTP"));
