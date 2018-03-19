"use strict";

jest.mock("../lib/get-latest-version");

const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");
const slash = require("slash");

// mocked modules
const getLatestVersion = require("../lib/get-latest-version");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");

// file under test
const lernaCreate = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

// assertion helpers
const addRemote = (cwd, remote = "origin", url = "git@github.com:test/test.git") =>
  execa("git", ["remote", "add", remote, url], { cwd });

const diffStaged = (cwd, ...args) => execa.stdout("git", ["diff", "--cached", ...args], { cwd });

const initRemoteFixture = fixtureName => initFixture(fixtureName).then(cwd => addRemote(cwd).then(() => cwd));

const gitLsOthers = (cwd, ...args) =>
  execa.stdout("git", ["ls-files", "--others", "--exclude-standard", ...args], { cwd });

const listUntracked = async cwd => {
  const list = await gitLsOthers(cwd, "-z");

  return list.split("\0").map(fp => slash(fp));
};

const manifestCreated = async cwd => {
  const file = await gitLsOthers(cwd, "--", "**/package.json");

  return fs.readJSON(path.join(cwd, file));
};

describe("CreateCommand", () => {
  getLatestVersion.mockReturnValue("1.0.0-mocked");

  // preserve value from @lerna-test/set-npm-userconfig
  const userconfig = process.env.npm_config_userconfig;

  afterEach(() => {
    // some tests delete or mangle this
    if (process.env.npm_config_userconfig !== userconfig) {
      process.env.npm_config_userconfig = userconfig;
    }
  });

  it("requires a name argument", async () => {
    const cwd = await initFixture("basic");

    try {
      await lernaCreate(cwd)();
    } catch (err) {
      expect(err.message).toMatch("Not enough non-option arguments");
    }
  });

  it("throws when adding a git dependency", async () => {
    const cwd = await initRemoteFixture("basic");

    try {
      await lernaCreate(cwd)(
        "git-pkg",
        "--dependencies",
        "git+ssh://git@notgithub.com/user/foo#semver:^1.2.3"
      );
    } catch (err) {
      expect(err.message).toMatch("Do not use git dependencies");
    }
  });

  it("creates a stub package", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-pkg");
    await gitAdd(cwd, ".");

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it("creates a stub package with a scoped name", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("@my-org/my-pkg");

    const result = await listUntracked(cwd);
    expect(result).toContain("packages/my-pkg/lib/my-pkg.js");
  });

  it("creates a stub package with transpiled output", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-pkg", "--es-module");
    await gitAdd(cwd, ".");

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it("creates a stub cli", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-cli", "--bin");
    await gitAdd(cwd, ".");

    if (process.platform === "win32") {
      // windows sucks at file permissions
      await gitAdd(cwd, "--chmod", "+x", "--", path.normalize("packages/my-cli/bin/my-cli"));
    }

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();

    // yargs is automatically added when CLI is stubbed
    expect(getLatestVersion).lastCalledWith("yargs", expect.objectContaining({ cwd }));
  });

  it("creates a stub cli with a custom name", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-cli", "--bin", "yay");

    const result = await listUntracked(cwd);
    expect(result).toContain("packages/my-cli/bin/yay");
  });

  it("creates a stub cli with transpiled output", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-es-cli", "--bin", "--es-module");
    await gitAdd(cwd, ".");

    if (process.platform === "win32") {
      // windows sucks at file permissions
      await gitAdd(cwd, "--chmod", "+x", "--", path.normalize("packages/my-es-cli/bin/my-es-cli"));
    }

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it("defaults user name and email to git config", async () => {
    const cwd = await initRemoteFixture("basic");
    const name = "Git McGitterson";
    const email = "test@git-fallback.com";

    // overwrite test defaults so it's really obvious
    await execa("git", ["config", "user.name", name], { cwd });
    await execa("git", ["config", "user.email", email], { cwd });

    // ignore test defaults as well as ~/.npmrc
    process.env.npm_config_userconfig = "/dev/null";

    await lernaCreate(cwd)("git-fallback");

    expect(await manifestCreated(cwd)).toHaveProperty("author", `${name} <${email}>`);
  });

  it("overrides init-license with --license", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("license-override", "--license", "MIT");

    expect(await manifestCreated(cwd)).toHaveProperty("license", "MIT");
  });

  it("sets private:true with --private", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("private-pkg", "--private");

    expect(await manifestCreated(cwd)).toHaveProperty("private", true);
  });

  it("defaults to npm_config_init_version when independent", async () => {
    const cwd = await initRemoteFixture("independent");

    process.env.npm_config_init_version = "100.0.0";

    await lernaCreate(cwd)("indy-pkg", "--private");

    delete process.env.npm_config_init_version;

    expect(await manifestCreated(cwd)).toHaveProperty("version", "100.0.0");
  });

  it("allows choice of package location", async () => {
    const cwd = await initRemoteFixture("custom-location");

    await lernaCreate(cwd)("custom-pkg", "modules");

    const result = await listUntracked(cwd);
    expect(result).toContain("modules/custom-pkg/package.json");
  });
});
