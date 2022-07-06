"use strict";

// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
const mockGetTwoFactorAuthRequired = jest.fn(() => Promise.resolve(false));

module.exports.getTwoFactorAuthRequired = mockGetTwoFactorAuthRequired;
