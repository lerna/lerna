import { prereleaseIdFromVersion } from "./prerelease-id-from-version";

test("prereleaseIdFromVersion() returns prerelease identifier", () => {
  expect(prereleaseIdFromVersion("1.0.0-alpha.0")).toBe("alpha");
});

test("prereleaseIdFromVersion() returns undefined for non-prerelease versions", () => {
  expect(prereleaseIdFromVersion("1.0.0")).toBe(undefined);
});

test("prereleaseIdFromVersion() returns undefined for invalid version argument", () => {
  const fn = prereleaseIdFromVersion as any;

  expect(fn()).toBe(undefined);
  expect(fn({})).toBe(undefined);
  expect(fn("foo")).toBe(undefined);
});
