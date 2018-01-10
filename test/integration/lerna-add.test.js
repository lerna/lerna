import path from "path";
import execa from "execa";
import globby from "globby";
import loadJson from "load-json-file";

import { LERNA_BIN } from "../helpers/constants";
import initFixture from "../helpers/initFixture";
import pkgMatchers from "../helpers/pkgMatchers";

const cli = (args, options) => execa(LERNA_BIN, ["add", ...args], options);

const loadFrom = cwd => filePath => loadJson(path.join(cwd, filePath));

expect.extend(pkgMatchers);

const getPkgs = async cwd => {
  const pkgs = await globby(["packages/**/package.json"], { cwd });
  const load = loadFrom(cwd);
  const manifests = await Promise.all(pkgs.map(pkg => load(pkg)));

  return manifests.reduce((results, manifest) => {
    results[manifest.name] = manifest;
    return results;
  }, {});
};

describe("lerna add", () => {
  test("add to all packages", async () => {
    const cwd = await initFixture("AddCommand/basic");
    await cli(["@test/package-1"], { cwd });
    const pkgs = await getPkgs(cwd);
    expect(pkgs["@test/package-1"]).not.toDependOn("@test/package-1");
    expect(pkgs["@test/package-2"]).toDependOn("@test/package-1");
    expect(pkgs["package-3"]).toDependOn("@test/package-1");
    expect(pkgs["package-4"]).toDependOn("@test/package-1");
  });
});
