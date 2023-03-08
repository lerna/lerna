import path from "path";
import _fs from "fs-extra";
import _writePkg from "write-pkg";
import { Package } from "./package";
import { npmInstall, npmInstallDependencies } from "./npm-install";

jest.mock("fs-extra");
jest.mock("write-pkg");
jest.mock("@lerna/child-process");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

const fs = jest.mocked(_fs);
const writePkg = jest.mocked(_writePkg);

describe("npm-install", () => {
  childProcess.exec.mockResolvedValue();
  fs.rename.mockResolvedValue();
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  fs.copy.mockResolvedValue();
  writePkg.mockResolvedValue();

  describe("npmInstall()", () => {
    it("returns a promise for a non-mangling install", async () => {
      const pkg = new Package(
        {
          name: "test-npm-install",
        } as any,
        path.normalize("/test/npm-install-promise"),
        path.normalize("/test")
      );

      await npmInstall(pkg, {
        npmClient: "yarn",
        npmClientArgs: ["--no-optional"],
        mutex: "file:foo",
      });

      expect(childProcess.exec).toHaveBeenLastCalledWith(
        "yarn",
        ["install", "--mutex", "file:foo", "--non-interactive", "--no-optional"],
        {
          cwd: pkg.location,
          env: {
            LERNA_PACKAGE_NAME: "test-npm-install",
            LERNA_EXEC_PATH: pkg.location,
            LERNA_ROOT_PATH: pkg.rootPath,
          },
          pkg,
          stdio: "pipe",
        }
      );
    });

    it("allows override of opts.stdio", async () => {
      const pkg = new Package(
        {
          name: "test-npm-install",
        } as any,
        path.normalize("/test/npm-install-stdio")
      );

      await npmInstall(pkg, {
        stdio: "inherit",
      });

      expect(childProcess.exec).toHaveBeenLastCalledWith(
        "npm",
        ["install"],
        expect.objectContaining({
          stdio: "inherit",
        })
      );
    });

    it("does not swallow errors", async () => {
      childProcess.exec.mockRejectedValueOnce(new Error("whoopsy-doodle"));

      const pkg = new Package(
        {
          name: "test-npm-install-error",
        } as any,
        path.normalize("/test/npm-install-error")
      );

      await expect(
        npmInstall(pkg, {
          npmClient: "yarn",
        })
      ).rejects.toThrow("whoopsy-doodle");

      expect(childProcess.exec).toHaveBeenLastCalledWith("yarn", ["install", "--non-interactive"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });
  });

  describe("npmInstallDependencies()", () => {
    it("installs dependencies in targeted directory", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          scripts: {
            test: "i am deleted",
          },
          dependencies: {
            "@scoped/caret": "^2.0.0",
            "local-dependency": "^1.0.0",
            exact: "1.0.0",
          },
          devDependencies: {
            "@scoped/exact": "2.0.0",
            caret: "^1.0.0",
            exact: "1.0.0", // will be removed
            "local-dev-dependency": "^1.0.0",
          },
          optionalDependencies: {
            "@scoped/others": "1.0.0", // will be removed
            caret: "^1.0.0",
            "local-dependency": "^1.0.0",
          },

          // TODO: refactor based on TS feedback
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          bundledDependencies: ["local-dependency", "@scoped/exact", "others"],
          bundleDependencies: ["local-dependency", "@scoped/exact", "others"],
        },
        path.normalize("/test/npm-install-deps")
      );
      const backupManifest = `${pkg.manifestLocation}.lerna_backup`;
      const dependencies = [
        "@scoped/caret@^2.0.0",
        "@scoped/exact@2.0.0",
        "caret@^1.0.0",
        "exact@1.0.0",
        "@scoped/others@1.0.0",
        "others@1.0.0",
      ];

      await npmInstallDependencies(pkg, dependencies, {});

      expect(fs.copy).toHaveBeenLastCalledWith(pkg.manifestLocation, backupManifest);
      expect(fs.renameSync).toHaveBeenLastCalledWith(backupManifest, pkg.manifestLocation);
      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/caret": "^2.0.0",
          // removed local-dependency
          exact: "1.0.0",
        },
        devDependencies: {
          "@scoped/exact": "2.0.0",
          caret: "^1.0.0",
          // removed local-dev-dependency
        },
        optionalDependencies: {
          "@scoped/others": "1.0.0",
          // removed caret, local-dependency
        },
        bundledDependencies: [/* removed local-dependency */ "others"],
        bundleDependencies: [
          /* removed  */
        ],
      });
      expect(childProcess.exec).toHaveBeenLastCalledWith("npm", ["install"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });

    it("supports custom registry", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "@scoped/tagged": "next",
            "local-dependency": "file:../local-dependency",
          },
          devDependencies: {
            tagged: "next",
            "local-dev-dependency": "file:../local-dev-dependency",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/tagged@next", "tagged@next"];
      const config = {
        registry: "https://custom-registry/npm-install-deps",
      };

      await npmInstallDependencies(pkg, dependencies, config);

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/tagged": "next",
        },
        devDependencies: {
          tagged: "next",
        },
      });
      expect(childProcess.exec).toHaveBeenLastCalledWith("npm", ["install"], {
        cwd: pkg.location,
        env: expect.objectContaining({
          npm_config_registry: config.registry,
        }),
        pkg,
        stdio: "pipe",
      });
    });

    it("supports npm install --global-style", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            caret: "^1.0.0",
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/foo@latest", "foo@latest", "caret@^1.0.0"];

      await npmInstallDependencies(pkg, dependencies, {
        npmGlobalStyle: true,
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/foo": "latest",
          foo: "latest",
        },
        devDependencies: {
          caret: "^1.0.0",
        },
      });
      expect(childProcess.exec).toHaveBeenLastCalledWith("npm", ["install", "--global-style"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });

    it("supports custom npmClient", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "@scoped/something": "^2.0.0",
            "local-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/something@^2.0.0", "something@^1.0.0"];

      await npmInstallDependencies(pkg, dependencies, {
        npmClient: "yarn",
        mutex: "network:12345",
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/something": "^2.0.0",
          something: "^1.0.0",
        },
      });
      expect(childProcess.exec).toHaveBeenLastCalledWith(
        "yarn",
        ["install", "--mutex", "network:12345", "--non-interactive"],
        { cwd: pkg.location, env: expect.any(Object), pkg, stdio: "pipe" }
      );
    });

    it("supports custom npmClientArgs", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          optionalDependencies: {
            "@scoped/something": "github:foo/bar",
            "local-optional-dependency": "^1.0.0",
          },
          devDependencies: {
            something: "github:foo/foo",
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];

      await npmInstallDependencies(pkg, dependencies, {
        npmClientArgs: ["--production", "--no-optional"],
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        optionalDependencies: {
          "@scoped/something": "github:foo/bar",
        },
        devDependencies: {
          something: "github:foo/foo",
        },
      });
      expect(childProcess.exec).toHaveBeenLastCalledWith(
        "npm",
        ["install", "--production", "--no-optional"],
        {
          cwd: pkg.location,
          env: expect.any(Object),
          pkg,
          stdio: "pipe",
        }
      );
    });

    it("overrides custom npmClient when using global style", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "@scoped/something": "github:foo/bar",
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            something: "github:foo/foo",
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];

      await npmInstallDependencies(pkg, dependencies, {
        npmClient: "yarn",
        npmGlobalStyle: true,
        mutex: "network:12345",
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/something": "github:foo/bar",
        },
        devDependencies: {
          something: "github:foo/foo",
        },
      });
      expect(childProcess.exec).toHaveBeenLastCalledWith("npm", ["install", "--global-style"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });

    it("calls npm ci instead of npm install when subCommand is ci", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "@scoped/something": "github:foo/bar",
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            something: "github:foo/foo",
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];

      await npmInstallDependencies(pkg, dependencies, {
        subCommand: "ci",
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/something": "github:foo/bar",
        },
        devDependencies: {
          something: "github:foo/foo",
        },
      });
      expect(childProcess.exec).toHaveBeenLastCalledWith("npm", ["ci"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });

    it("finishes early when no dependencies exist", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies: any[] = [];

      await npmInstallDependencies(pkg, dependencies, {});

      expect(childProcess.exec).not.toHaveBeenCalled();
    });

    it("defaults temporary dependency versions to '*'", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = [
        "noversion",
        "@scoped/noversion", // sorted by write-pkg
      ];

      await npmInstallDependencies(pkg, dependencies, {});

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/noversion": "*",
          noversion: "*",
        },
        devDependencies: {},
      });
    });

    it("rejects with copy error", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps-copy-error",
          version: "1.0.0",
        },
        path.normalize("/test/npm-install-deps/copyError")
      );
      const dependencies = ["I'm just here so we don't exit early"];

      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      fs.copy.mockRejectedValueOnce(new Error("Unable to copy file"));

      await expect(npmInstallDependencies(pkg, dependencies, {})).rejects.toThrow("Unable to copy file");
    });

    it("cleans up synchronously after writeFile error", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps-write-error",
          version: "1.0.0",
        },
        path.normalize("/test/npm-install-deps/writeError")
      );
      const backupManifest = `${pkg.manifestLocation}.lerna_backup`;
      const dependencies = ["just-here-so-we-dont-exit-early"];

      writePkg.mockRejectedValueOnce(new Error("Unable to write file"));

      await expect(npmInstallDependencies(pkg, dependencies, {})).rejects.toThrow("Unable to write file");
      expect(fs.renameSync).toHaveBeenLastCalledWith(backupManifest, pkg.manifestLocation);
    });

    it("cleans up synchronously after client install error", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps-client-error",
          version: "1.0.0",
        },
        path.normalize("/test/npm-install-deps/clientError")
      );
      const backupManifest = `${pkg.manifestLocation}.lerna_backup`;
      const dependencies = ["just-here-so-we-dont-exit-early"];

      childProcess.exec.mockRejectedValueOnce(new Error("Unable to install"));

      await expect(npmInstallDependencies(pkg, dependencies, {})).rejects.toThrow("Unable to install");
      expect(fs.renameSync).toHaveBeenLastCalledWith(backupManifest, pkg.manifestLocation);
    });
  });
});
