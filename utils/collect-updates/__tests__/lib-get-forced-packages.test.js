"use strict";

// file under test
const getForcedPackages = require("../lib/get-forced-packages");

test("no argument", () => {
  const result = getForcedPackages();

  expect(Array.from(result)).toEqual([]);
});

test("--force-publish", () => {
  const result = getForcedPackages(true);

  expect(Array.from(result)).toEqual(["*"]);
});

test("--force-publish *", () => {
  const result = getForcedPackages("*");

  expect(Array.from(result)).toEqual(["*"]);
});

test("--force-publish foo", () => {
  const result = getForcedPackages("foo");

  expect(Array.from(result)).toEqual(["foo"]);
});

test("--force-publish foo,bar", () => {
  const result = getForcedPackages("foo,bar");

  expect(Array.from(result)).toEqual(["foo", "bar"]);
});

test("--force-publish foo --force-publish bar", () => {
  const result = getForcedPackages(["foo", "bar"]);

  expect(Array.from(result)).toEqual(["foo", "bar"]);
});
