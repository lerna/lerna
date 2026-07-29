import semver from "semver";

import { makeCanaryVersion } from "./make-canary-version";

// short SHAs come in three flavors that semver treats very differently without the "sha." guard:
// - all digits with a leading zero: invalid numeric identifier (see lerna/lerna#1118)
// - all digits without a leading zero: valid, but a *numeric* identifier in a different
//   precedence class than alphanumeric hex SHAs
// - regular hex: alphanumeric identifier
const ALL_DIGIT_LEADING_ZERO_SHA = "0812331";
const ALL_DIGIT_SHA = "8123312";
const HEX_SHA = "81e3b44";
const SHAS = [ALL_DIGIT_LEADING_ZERO_SHA, ALL_DIGIT_SHA, HEX_SHA];

describe("makeCanaryVersion", () => {
  test("produces the documented shape", () => {
    expect(makeCanaryVersion("1.0.1", "alpha", 1, HEX_SHA)).toBe("1.0.1-alpha.0.sha-81e3b44");
    expect(makeCanaryVersion("1.0.1", "alpha", 1, HEX_SHA)).toMatch(
      /^\d+\.\d+\.\d+-[a-zA-Z]+\.\d+\.sha-[0-9a-f]+$/
    );
  });

  test.each(SHAS)("produces a strictly valid semver version for sha %s", (sha) => {
    const version = makeCanaryVersion("1.0.1", "alpha", 1, sha);

    expect(semver.valid(version)).toBeTruthy();
  });

  test.each(SHAS)("parses the sha as a string prerelease identifier for sha %s", (sha) => {
    const version = makeCanaryVersion("1.0.1", "alpha", 1, sha);
    const prerelease = semver.parse(version)!.prerelease;

    // a single (string) comparison class regardless of the sha's characters,
    // so precedence never flaps between numeric and alphanumeric ordering
    expect(typeof prerelease[prerelease.length - 1]).toBe("string");
  });

  test.each(SHAS)("produces a version usable as an exact dependency range for sha %s", (sha) => {
    const version = makeCanaryVersion("1.0.1", "alpha", 1, sha);

    // an invalid comparator here would make sibling packages with pinned
    // dependencies on this version uninstallable
    expect(() => new semver.Range(version)).not.toThrow();
    expect(semver.satisfies(version, `=${version}`)).toBe(true);
  });

  test.each(SHAS)("orders successive canary versions by counter for sha %s", (sha) => {
    const first = makeCanaryVersion("1.0.1", "alpha", 1, sha);
    const second = makeCanaryVersion("1.0.1", "alpha", 2, sha);

    expect(semver.gt(second, first)).toBe(true);
  });

  test("orders canary versions by counter across sha classes", () => {
    const first = makeCanaryVersion("1.0.1", "alpha", 1, HEX_SHA);
    const second = makeCanaryVersion("1.0.1", "alpha", 2, ALL_DIGIT_LEADING_ZERO_SHA);
    const third = makeCanaryVersion("1.0.1", "alpha", 3, ALL_DIGIT_SHA);

    expect(semver.gt(second, first)).toBe(true);
    expect(semver.gt(third, second)).toBe(true);
  });

  test("clamps a zero refCount to counter 0", () => {
    expect(makeCanaryVersion("1.0.1", "alpha", 0, HEX_SHA)).toBe("1.0.1-alpha.0.sha-81e3b44");
  });
});
