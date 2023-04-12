"use strict";

import { commandRunner, gitAdd, gitSHASerializer, initFixtureFactory } from "@lerna/test-helpers";
import execa from "execa";
import fs from "fs-extra";
import _pacote from "pacote";
import path from "path";
import slash from "slash";

jest.mock("pacote");

const pacote = jest.mocked(_pacote);

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaCreate = commandRunner(require("../src/command"));

// stabilize commit SHA
expect.addSnapshotSerializer(gitSHASerializer);

// assertion helpers
const addRemote = (cwd, remote = "origin", url = "git@github.com:test/test.git") =>
  execa("git", ["remote", "add", remote, url], { cwd });

const diffStaged = (cwd, ...args) =>
  execa("git", ["diff", "--cached", ...args], { cwd }).then((result) => result.stdout);

const initRemoteFixture = (fixtureName) =>
  initFixture(fixtureName).then((cwd) => addRemote(cwd).then(() => cwd));

const gitLsOthers = (cwd, ...args) =>
  execa("git", ["ls-files", "--others", "--exclude-standard", ...args], { cwd }).then(
    (result) => result.stdout
  );

const listUntracked = async (cwd) => {
  const list = await gitLsOthers(cwd, "-z");

  return list.split("\0").map((fp) => slash(fp));
};

const manifestCreated = async (cwd) => {
  const file = await gitLsOthers(cwd, "--", "**/package.json");

  return fs.readJSON(path.join(cwd, file));
};

describe("CreateCommand", () => {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  pacote.manifest.mockImplementation(() => Promise.resolve({ version: "1.0.0-mocked" }));

  // preserve value from @lerna/test-helpers/src/lib/npm/set-npm-userconfig
  const userconfig = process.env.npm_config_userconfig;

  afterEach(() => {
    // some tests delete or mangle this
    if (process.env.npm_config_userconfig !== userconfig) {
      process.env.npm_config_userconfig = userconfig;
    }
  });

  it("requires a name argument", async () => {
    const cwd = await initFixture("basic");
    const command = lernaCreate(cwd)();

    await expect(command).rejects.toThrow("Not enough non-option arguments");
  });

  it("throws when adding a git dependency", async () => {
    const cwd = await initRemoteFixture("basic");
    const command = lernaCreate(cwd)(
      "git-pkg",
      "--dependencies",
      "git+ssh://git@notgithub.com/user/foo#semver:^1.2.3"
    );

    await expect(command).rejects.toThrow("Do not use git dependencies");
  });

  // TODO: troubleshoot and reenable
  it.skip("creates a stub package", async () => {
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

  // TODO: troubleshoot and reenable
  it.skip("creates a stub package with transpiled output", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-pkg", "--es-module");
    await gitAdd(cwd, ".");

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  // TODO: troubleshoot and reenable
  it.skip("creates a stub cli", async () => {
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
    expect(pacote.manifest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "yargs",
        type: "tag",
        fetchSpec: "latest",
      }),
      expect.objectContaining({
        // an npm-conf snapshot
        registry: "https://registry.npmjs.org/",
      })
    );
  });

  it("creates a stub cli with a custom name", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-cli", "--bin", "yay");

    const result = await listUntracked(cwd);
    expect(result).toContain("packages/my-cli/bin/yay");
  });

  // TODO: troubleshoot and reenable
  it.skip("creates a stub cli with transpiled output", async () => {
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

    await lernaCreate(cwd)("indy-pkg");

    delete process.env.npm_config_init_version;

    expect(await manifestCreated(cwd)).toHaveProperty("version", "100.0.0");
  });

  it("allows choice of package location", async () => {
    const cwd = await initRemoteFixture("custom-location");

    await lernaCreate(cwd)("custom-pkg", "modules");

    const result = await listUntracked(cwd);
    expect(result).toContain("modules/custom-pkg/package.json");
  });

  it("adds local dependencies", async () => {
    const cwd = await initRemoteFixture("independent");

    await lernaCreate(cwd)("foo-pkg", "--dependencies", "sibling-pkg");

    expect(await manifestCreated(cwd)).toHaveProperty("dependencies", {
      "sibling-pkg": "^2.0.0",
    });
  });

  it("adds local dependency as relative file specifier when others exist", async () => {
    const cwd = await initRemoteFixture("relative-file-spec");

    await lernaCreate(cwd)("foo-pkg", "--dependencies", "sibling-pkg");

    expect(await manifestCreated(cwd)).toHaveProperty("dependencies", {
      "sibling-pkg": "file:../sibling-pkg",
    });
  });

  it("reuses existing external dependency version", async () => {
    const cwd = await initRemoteFixture("independent");

    await lernaCreate(cwd)("foo-pkg", "--dependencies", "pify");

    expect(await manifestCreated(cwd)).toHaveProperty("dependencies", {
      pify: "^2.3.0",
    });
  });

  it("supports external dependency version specifier", async () => {
    const cwd = await initRemoteFixture("independent");

    await lernaCreate(cwd)("foo-pkg", "--dependencies", "bar@1.0.0", "baz@^2.0.0", "qux@~3.0.0");

    expect(await manifestCreated(cwd)).toHaveProperty("dependencies", {
      bar: "1.0.0",
      baz: "^2.0.0",
      qux: "~3.0.0",
    });
  });

  it("respects npm_config_save_exact", async () => {
    const cwd = await initRemoteFixture("independent");

    process.env.npm_config_save_exact = "true";

    await lernaCreate(cwd)("foo-pkg", "--dependencies", "sibling-pkg");

    delete process.env.npm_config_save_exact;

    expect(await manifestCreated(cwd)).toHaveProperty("dependencies", {
      "sibling-pkg": "2.0.0",
    });
  });

  it("defaults homepage to a subpath of root homepage when it exists", async () => {
    const cwd = await initRemoteFixture("independent");
    const rootManifest = path.join(cwd, "package.json");
    const json = await fs.readJSON(rootManifest);

    json.homepage = "https://github.com/test/test";
    await fs.writeJSON(rootManifest, json);

    await lernaCreate(cwd)("foo-pkg");

    expect(await manifestCreated(cwd)).toHaveProperty(
      "homepage",
      "https://github.com/test/test/tree/main/packages/foo-pkg#readme"
    );
  });

  it("appends to pathname of non-github root homepage", async () => {
    const cwd = await initRemoteFixture("independent");
    const rootManifest = path.join(cwd, "package.json");
    const json = await fs.readJSON(rootManifest);

    json.homepage = "https://bitbucket.com/test/test";
    await fs.writeJSON(rootManifest, json);

    await lernaCreate(cwd)("foo-pkg");

    expect(await manifestCreated(cwd)).toHaveProperty(
      "homepage",
      // no doubt wrong, but just illustrative of condition
      "https://bitbucket.com/test/test/packages/foo-pkg"
    );
  });

  it("does not mutate explicit --homepage pathname", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("foo-pkg", "--homepage", "http://google.com/");

    expect(await manifestCreated(cwd)).toHaveProperty("homepage", "http://google.com/");
  });

  it("defaults schemeless homepage to http://", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("foo-pkg", "--homepage", "google.com");

    expect(await manifestCreated(cwd)).toHaveProperty("homepage", "http://google.com/");
  });

  it("overrides default publishConfig.access with --access=restricted", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("@foo/pkg", "--access", "restricted");

    expect(await manifestCreated(cwd)).toHaveProperty("publishConfig", {
      access: "restricted",
    });
  });

  it("sets non-public publishConfig.registry with --registry", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("@foo/pkg", "--registry", "http://my-private-registry.com/");

    expect(await manifestCreated(cwd)).toHaveProperty("publishConfig", {
      registry: "http://my-private-registry.com/",
    });
  });

  it("sets publishConfig.tag with --tag", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("@foo/pkg", "--tag", "next");

    expect(await manifestCreated(cwd)).toHaveProperty("publishConfig", {
      access: "public",
      tag: "next",
    });
  });

  it("skips repository field when git remote is missing", async () => {
    const cwd = await initFixture("basic");

    await lernaCreate(cwd)("a-pkg");

    expect(await manifestCreated(cwd)).not.toHaveProperty("repository");
  });

  it("adds type field when using esModule", async () => {
    const cwd = await initFixture("basic");

    await lernaCreate(cwd)("a-pkg", "--es-module");

    expect(await manifestCreated(cwd)).toHaveProperty("type", "module");
  });

  it("skips type field when not using esModule", async () => {
    const cwd = await initFixture("basic");

    await lernaCreate(cwd)("a-pkg");

    expect(await manifestCreated(cwd)).not.toHaveProperty("type");
  });
});
