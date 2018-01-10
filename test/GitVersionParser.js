import log from "npmlog";

// file under test
import GitVersionParser from "../src/GitVersionParser";

// silence logs
log.level = "silent";

describe("GitVersionParser", () => {
  describe("parseVersion - without prefix", () => {
    const parser = new GitVersionParser("");

    it("should work for semver version", () => {
      expect(parser.parseVersion("0.0.2")).toEqual({
        prefix: null,
        version: "0.0.2",
      });

      expect(parser.parseVersion("~0.0.2")).toEqual({
        prefix: null,
        version: "~0.0.2",
      });
    });

    it("should work for git url", () => {
      expect(parser.parseVersion("github:user-foo/project-foo#v0.0.1")).toEqual({
        prefix: "github:user-foo/project-foo#",
        version: "v0.0.1",
      });

      expect(parser.parseVersion("git@github.com:user-foo/project-foo#0.0.5")).toEqual({
        prefix: "git@github.com:user-foo/project-foo#",
        version: "0.0.5",
      });
    });
  });

  describe("parseVersion - with version prefix", () => {
    const parser = new GitVersionParser("v");

    it("should work for semver version", () => {
      expect(parser.parseVersion("0.0.2")).toEqual({
        prefix: null,
        version: "0.0.2",
      });

      expect(parser.parseVersion("~0.0.2")).toEqual({
        prefix: null,
        version: "~0.0.2",
      });
    });

    it("should work for git url", () => {
      expect(parser.parseVersion("github:user-foo/project-foo#v0.0.1")).toEqual({
        prefix: "github:user-foo/project-foo#v",
        version: "0.0.1",
      });

      expect(parser.parseVersion("git@github.com:user-foo/project-foo#0.0.5")).toEqual({
        prefix: null,
        version: "git@github.com:user-foo/project-foo#0.0.5",
      });

      expect(parser.parseVersion("git@github.com:user-foo/project-foo#v0.0.5")).toEqual({
        prefix: "git@github.com:user-foo/project-foo#v",
        version: "0.0.5",
      });
    });
  });
});
