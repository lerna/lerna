"use strict";

const path = require("path");

// test helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const fs = require("fs-extra");
const { getPackages } = require("@lerna/project");

// file under test
const useTempManifest = require("../use-temporary-manifest");

describe("use-temporary-manifest", () => {
  it("should work", async () => {
    const testDir = await initFixture("basic");
    const [pkg] = await getPackages(testDir);
    const pkgJsonPath = path.join(pkg.location, "package.json");
    const prevPkgJson = await fs.readFile(pkgJsonPath, "utf-8");
    const tempPkgJson = { name: "new", version: "1.2.3" };

    const doSomethingCalled = createPromiseFactory(() => {});
    const doSomethingCalledPromise = doSomethingCalled.promiseFactory();
    const doSomething = createPromiseFactory(doSomethingCalled.resolve);

    const cleanupTempManifest = useTempManifest(pkg, tempPkgJson, doSomething.promiseFactory);

    // wait for doSomething called
    await doSomethingCalledPromise;

    // because doSomething hasn't resolved, we can expect package.json.lerna_backup
    const backupPath = path.join(pkg.location, "package.json.lerna_backup");
    expect(() => fs.accessSync(backupPath)).not.toThrow();
    expect(await fs.readFile(backupPath, "utf-8")).toEqual(prevPkgJson);

    const currentPkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"));
    expect(currentPkgJson).toEqual(tempPkgJson);

    // ok now going to resolve doSomething
    doSomething.resolve();

    await cleanupTempManifest;

    expect(() => fs.accessSync(backupPath)).toThrow();
    expect(await fs.readFile(pkgJsonPath, "utf-8")).toEqual(prevPkgJson);
  });
});

function createPromiseFactory(doSomething) {
  let resolve;
  let reject;
  const promiseFactory = () =>
    new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
      doSomething();
    });
  return {
    resolve: () => resolve(),
    reject: () => reject(),
    promiseFactory,
  };
}
