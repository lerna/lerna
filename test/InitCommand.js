import fs from "graceful-fs";
import path from "path";

import {
  mkdirpAsync,
  rimrafAsync,
} from "./helpers/fixtureUtils";
import initFixture from "./helpers/initFixture";

import InitCommand from "../src/commands/InitCommand";

describe("InitCommand", () => {
  describe("in an empty directory", () => {
    let testDir;

    beforeEach(() => initFixture("InitCommand/empty").then((dir) => {
      testDir = dir;

      // ensure fixture directory is _completely_ empty
      return Promise.all([".git", "DELETE_ME"].map((fp) =>
        rimrafAsync(path.join(dir, fp))
      ));
    }));

    it("initializes git repo with lerna files", (done) => {
      const instance = new InitCommand([], {});

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(fs.readdirSync(testDir)).toEqual([
            ".git",
            "lerna.json",
            "package.json",
          ]);

          const lernaJson = require(path.join(testDir, "lerna.json"));
          expect(lernaJson).toEqual({
            lerna: instance.lernaVersion,
            packages: ["packages/*"],
            version: "0.0.0",
          });

          const packageJson = require(path.join(testDir, "package.json"));
          expect(packageJson).toEqual({
            devDependencies: {
              lerna: instance.lernaVersion,
            },
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("initializes git repo with lerna files in independent mode", (done) => {
      const instance = new InitCommand([], {
        independent: true,
      });

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(fs.readdirSync(testDir)).toEqual([
            ".git",
            "lerna.json",
            "package.json",
          ]);

          const lernaJson = require(path.join(testDir, "lerna.json"));
          expect(lernaJson.version).toBe("independent");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe("in a subdirectory of a git repo", () => {
    let testDir;

    beforeEach(() => initFixture("InitCommand/empty").then((dir) => {
      const subDir = path.join(dir, "subdir");

      return mkdirpAsync(subDir).then(() => {
        process.chdir(subDir);
        testDir = subDir;
      });
    }));

    it("creates lerna files", (done) => {
      const instance = new InitCommand([], {});

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(fs.readdirSync(testDir)).toEqual([
            "lerna.json",
            "package.json",
          ]);

          const lernaJson = require(path.join(testDir, "lerna.json"));
          expect(lernaJson).toEqual({
            lerna: instance.lernaVersion,
            packages: ["packages/*"],
            version: "0.0.0",
          });

          const packageJson = require(path.join(testDir, "package.json"));
          expect(packageJson).toEqual({
            devDependencies: {
              lerna: instance.lernaVersion,
            },
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe("when package.json exists", () => {
    let packageJsonLocation;

    beforeEach(() => initFixture("InitCommand/has-package").then((dir) => {
      packageJsonLocation = path.join(dir, "package.json");
    }));

    it("adds lerna to sorted devDependencies", (done) => {
      fs.writeFileSync(packageJsonLocation, JSON.stringify({
        name: "repo-root",
        devDependencies: {
          alpha: "first",
          omega: "last",
        },
      }));

      const instance = new InitCommand([], {});

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          const packageJson = require(packageJsonLocation);
          expect(packageJson).toEqual({
            name: "repo-root",
            devDependencies: {
              alpha: "first",
              lerna: instance.lernaVersion,
              omega: "last",
            },
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("updates existing lerna in devDependencies", (done) => {
      fs.writeFileSync(packageJsonLocation, JSON.stringify({
        name: "repo-root",
        dependencies: {
          alpha: "first",
          omega: "last",
        },
        devDependencies: {
          lerna: "0.1.100",
        },
      }));

      const instance = new InitCommand([], {});

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          const packageJson = require(packageJsonLocation);
          expect(packageJson).toEqual({
            name: "repo-root",
            dependencies: {
              alpha: "first",
              omega: "last",
            },
            devDependencies: {
              lerna: instance.lernaVersion,
            },
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("updates existing lerna in sorted dependencies", (done) => {
      fs.writeFileSync(packageJsonLocation, JSON.stringify({
        name: "repo-root",
        dependencies: {
          alpha: "first",
          lerna: "0.1.100",
          omega: "last",
        },
      }));

      const instance = new InitCommand([], {});

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          const packageJson = require(packageJsonLocation);
          expect(packageJson).toEqual({
            name: "repo-root",
            dependencies: {
              alpha: "first",
              lerna: instance.lernaVersion,
              omega: "last",
            },
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe("when lerna.json exists", () => {
    let lernaJsonLocation;

    beforeEach(() => initFixture("InitCommand/has-lerna").then((dir) => {
      lernaJsonLocation = path.join(dir, "lerna.json");
    }));

    it("updates lerna property to current version", (done) => {
      fs.writeFileSync(lernaJsonLocation, JSON.stringify({
        lerna: "0.1.100",
        packages: ["foo/*"],
        version: "1.2.3",
        hoist: true,
      }));

      const instance = new InitCommand([], {});

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          const lernaJson = require(lernaJsonLocation);
          expect(lernaJson).toEqual({
            lerna: instance.lernaVersion,
            packages: ["foo/*"],
            version: "1.2.3",
            hoist: true,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("updates lerna property to current version in independent mode", (done) => {
      fs.writeFileSync(lernaJsonLocation, JSON.stringify({
        lerna: "0.1.100",
        packages: ["bar/*"],
        version: "independent",
        hoist: true,
      }));

      const instance = new InitCommand([], {
        independent: true,
      });

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          const lernaJson = require(lernaJsonLocation);
          expect(lernaJson).toEqual({
            lerna: instance.lernaVersion,
            packages: ["bar/*"],
            version: "independent",
            hoist: true,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe("when VERSION exists", () => {
    let testDir;

    beforeEach(() => initFixture("InitCommand/has-version").then((dir) => {
      testDir = dir;
    }));

    it("removes file", (done) => {
      const instance = new InitCommand([], {});

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(fs.readdirSync(testDir)).toEqual([
            ".git",
            "lerna.json",
            "package.json",
          ]);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("logs deprecation", (done) => {
      const instance = new InitCommand([], {});
      instance.logger = {
        verbose: jest.fn(),
        info: jest.fn(),
        success: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(instance.logger.info).toBeCalledWith("Removing old VERSION file.");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("uses value for lerna.json version property", (done) => {
      const instance = new InitCommand([], {});

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          const lernaJson = require(path.join(testDir, "lerna.json"));
          expect(lernaJson).toHaveProperty("version", "1.2.3");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });
});
