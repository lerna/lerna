import assert from "assert";

import NpmUtilities from "../src/NpmUtilities";

describe("NpmUtilities", () => {
  it("should exist", () => {
    assert.ok(NpmUtilities);
  });

  describe(".splitVersion()", () => {
    [
      ["foo", ["foo", undefined], "no version"],
      ["foo@1.0.0", ["foo", "1.0.0"], "exact version"],
      ["foo@^1.0.0", ["foo", "^1.0.0"], "caret range"],
      ["@foo/bar", ["@foo/bar", undefined], "scoped with no version"],
      ["@foo/bar@1.0.0",  ["@foo/bar", "1.0.0"], "scoped with exact version"],
      ["@foo/bar@^1.0.0", ["@foo/bar", "^1.0.0"], "scoped with caret range"],
    ].forEach(([have, want, desc]) => {
      it("should handle " + desc, () => {
        assert.deepEqual(NpmUtilities.splitVersion(have), want);
      });
    });
  });

  describe(".getExecOpts()", () => {
    const originalEnv = Object.assign({}, process.env);
    const mockEnv = {
      mock_value: 1,
      NODE_ENV: "lerna-test",
    };

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should handle environment variables properly", () => {
      process.env = mockEnv;
      const want = {
        cwd: "test_dir",
        env: Object.assign({}, mockEnv, {
          npm_config_registry: "https://my-secure-registry/npm"
        })
      };
      assert.deepEqual(NpmUtilities.getExecOpts("test_dir", "https://my-secure-registry/npm"), want);
    });

    it("should handle missing environment variables", () => {
      process.env = mockEnv;
      const want = {cwd: "test_dir"};
      assert.deepEqual(NpmUtilities.getExecOpts("test_dir"), want);
    });
  });
});
