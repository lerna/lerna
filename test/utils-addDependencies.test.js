"use strict";

const Repository = require("../src/Repository");
const collectPackages = require("../src/utils/collectPackages");
const createPackageGraph = require("../src/utils/createPackageGraph");

// helpers
const initFixture = require("./helpers/initFixture");

// file under test
const addDependencies = require("../src/utils/addDependencies");

describe("addDependencies", () => {
  // for reference: 1->2, 1->3, 1->4, 2->4, 2->5, 3->4, 3->6, 4->1, 4->4,  5->4, 6->4, 7->4
  // We design the package tree in a very specific way. We want to test several different things
  // * A package depending on itself isn't added twice (package 4)
  // * A package being added twice in the same stage of the expansion isn't added twice (package 4)
  // * A package that has already been processed wont get added twice (package 1)
  it("should add all transitive dependencies of passed in packages with no repeats", async () => {
    const cwd = await initFixture("PackageUtilities/cycles-and-repeated-deps");
    const packages = collectPackages(new Repository(cwd));
    const packageGraph = createPackageGraph(packages);

    // we need to start with one package and have it add the deps required
    const packagesToExpand = packages.filter(pkg => pkg.name === "package-1");
    const packagesWithDeps = addDependencies(packagesToExpand, packageGraph);

    // should follow all transitive deps and pass all packages except 7 with no repeats
    expect(packagesWithDeps).toEqual([
      expect.objectContaining({ name: "package-1" }),
      expect.objectContaining({ name: "package-2" }),
      expect.objectContaining({ name: "package-3" }),
      expect.objectContaining({ name: "package-4" }),
      expect.objectContaining({ name: "package-5" }),
      expect.objectContaining({ name: "package-6" }),
    ]);
  });
});
