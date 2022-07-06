"use strict";

// file under test
const { getPackagesForOption } = require("../lib/get-packages-for-option");

test("no argument", () => {
  const result = getPackagesForOption();

  expect(Array.from(result)).toEqual([]);
});

test("--config-option", () => {
  const result = getPackagesForOption(true);

  expect(Array.from(result)).toEqual(["*"]);
});

test("--config-option *", () => {
  const result = getPackagesForOption("*");

  expect(Array.from(result)).toEqual(["*"]);
});

test("--config-option foo", () => {
  const result = getPackagesForOption("foo");

  expect(Array.from(result)).toEqual(["foo"]);
});

test("--config-option foo,bar", () => {
  const result = getPackagesForOption("foo,bar");

  expect(Array.from(result)).toEqual(["foo", "bar"]);
});

test("--config-option foo --config-option bar", () => {
  const result = getPackagesForOption(["foo", "bar"]);

  expect(Array.from(result)).toEqual(["foo", "bar"]);
});
