"use strict";

const path = require("path");
const globby = require("globby");
const loadJson = require("load-json-file");
const pMap = require("p-map");

const cliRunner = require("@lerna-test/cli-runner");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const pkgMatchers = require("@lerna-test/pkg-matchers");

expect.extend(pkgMatchers);

describe("lerna add", () => {
  test("add to all packages", async () => {
    const cwd = await initFixture("lerna-add");

    const { stderr } = await cliRunner(cwd)("add", "@test/package-1");
    expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info Adding @test/package-1 in 3 packages
lerna info filter [ '@test/package-2', 'package-3', 'package-4' ]
lerna info Bootstrapping 3 packages
lerna info Symlinking packages and binaries
lerna success Bootstrapped 3 packages
`);

    const filePaths = await globby("packages/*/package.json", { cwd });
    const [pkg1, pkg2, pkg3, pkg4] = await pMap(filePaths.sort(), fp => loadJson(path.join(cwd, fp)));

    expect(pkg1).not.toDependOn("@test/package-1");
    expect(pkg2).toDependOn("@test/package-1");
    expect(pkg3).toDependOn("@test/package-1");
    expect(pkg4).toDependOn("@test/package-1");
  });
});
