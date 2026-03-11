/* eslint-disable @nx/enforce-module-boundaries */
// nx-ignore-next-line
import { initFixtureFactory } from "@lerna/test-helpers";
import { packDirectory } from "./pack-directory";
import { getPackages } from "./project";

require("@lerna/test-helpers/src/lib/silence-logging");

jest.unmock("./run-lifecycle");

const npmConf = require("./npm-conf");

const initFixture = initFixtureFactory(__dirname);

describe("pack-directory glob files", () => {
  it("includes files matched by glob patterns in the package.json files field", async () => {
    const cwd = await initFixture("pack-directory-glob-files");
    const conf = npmConf({ prefix: cwd }).snapshot;
    const pkgs = await getPackages(cwd);

    expect(pkgs).toHaveLength(1);
    const pkg = pkgs[0];

    const result = await packDirectory(pkg, pkg.location, conf);

    // Extract just the file paths from the packed result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packedFiles = (result.files as any[]).map((f: { path: string }) => f.path).sort();

    // Verify glob-matched files are included
    expect(packedFiles).toContain("src/a.mjs");
    expect(packedFiles).toContain("src/b.mjs");
    expect(packedFiles).toContain("src/c.cjs");
    expect(packedFiles).toContain("src/d.cjs");

    // Verify directory entry files are included
    expect(packedFiles).toContain("dist/index.js");

    // Verify package.json is always included
    expect(packedFiles).toContain("package.json");

    // Verify non-matching files are excluded
    expect(packedFiles).not.toContain("src/ignored.ts");

    // Verify total count: 4 glob-matched + 1 dist + 1 package.json = 6
    expect(result.entryCount).toBe(6);
  });
});
